// PP-OCRv6 (small) text detection + recognition, run in the browser with
// onnxruntime-web. The models are plain PaddleX ONNX exports, so pre/post
// processing is ported here from PaddleOCR's DetResizeForTest, DBPostProcess,
// resize_norm_img and CTCLabelDecode.

import type { InferenceSession, Tensor as OrtTensor } from "onnxruntime-web";

const HF = "https://huggingface.co/PaddlePaddle";
const DET_MODEL_URL = `${HF}/PP-OCRv6_small_det_onnx/resolve/main/inference.onnx`;
const REC_MODEL_URL = `${HF}/PP-OCRv6_small_rec_onnx/resolve/main/inference.onnx`;
const REC_CONFIG_URL = `${HF}/PP-OCRv6_small_rec_onnx/resolve/main/inference.yml`;

// From each model's inference.yml.
const DET_MAX_SIDE = 960;
const DET_SIZE_STEP = 32;
const DET_THRESH = 0.2;
const DET_BOX_THRESH = 0.45;
const DET_UNCLIP_RATIO = 1.4;
const DET_MAX_CANDIDATES = 3000;
const DET_MEAN = [0.485, 0.456, 0.406] as const;
const DET_STD = [0.229, 0.224, 0.225] as const;
const REC_MEAN = [0.5, 0.5, 0.5] as const;
const REC_STD = [0.5, 0.5, 0.5] as const;
const REC_HEIGHT = 48;

// The recognition export declares dynamic shapes [1,3,48,160]..[8,3,48,3200],
// so wide crops get a wider tensor instead of being squashed into 320.
const REC_BATCH = 8;
const REC_BASE_WIDTH = 320;
const REC_MAX_WIDTH = 3200;
const REC_WIDTH_STEP = 32;

// DBPostProcess.min_size, and the +2 it adds after unclipping.
const MIN_BOX_SIDE = 3;
const UNCLIPPED_MIN_SIDE = MIN_BOX_SIDE + 2;
// get_rotate_crop_image rotates a crop 90° when it is this much taller than wide.
const VERTICAL_RATIO = 1.5;
// PaddleOCR's default drop_score.
const DROP_SCORE = 0.5;
// Two boxes belong to the same row when they overlap by half the shorter one.
const ROW_OVERLAP = 0.5;
const BYTE_MAX = 255;

export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface OcrLine {
  box: Box;
  score: number;
  text: string;
}

export interface OcrResult {
  lines: OcrLine[];
  text: string;
}

export interface LoadProgress {
  file: string;
  loaded: number;
  total: number;
}

/* -------------------------------------------------------------------------- */
/* Pure helpers                                                               */
/* -------------------------------------------------------------------------- */

const DICT_ITEM = /^\s*- (.*?)\r?$/;

/**
 * Pulls `PostProcess.character_dict` out of the PaddleX inference.yml — one
 * character per list item, running to the end of the file. PaddleX single-
 * quotes the characters YAML would otherwise choke on.
 */
export function parseCharDict(yaml: string): string[] {
  const start = yaml.indexOf("character_dict:\n");
  if (start === -1) {
    throw new Error("character_dict not found in recognition config");
  }

  const chars: string[] = [];
  for (const line of yaml.slice(start).trimEnd().split("\n").slice(1)) {
    const item = DICT_ITEM.exec(line)?.[1];
    if (item === undefined) {
      break;
    }
    const quoted =
      item.length > 1 && item.startsWith("'") && item.endsWith("'");
    chars.push(quoted ? item.slice(1, -1).replaceAll("''", "'") : item);
  }

  if (chars.length === 0) {
    throw new Error("character_dict in recognition config is empty");
  }
  return chars;
}

/**
 * CTCLabelDecode: index 0 is the blank, repeats collapse. PaddleOCR appends a
 * space character when `use_space_char` is set, which shows up here as the
 * model having exactly one class more than blank + dictionary.
 */
export function buildCharset(dict: string[], numClasses: number): string[] {
  const charset = ["<blank>", ...dict];
  while (charset.length < numClasses) {
    charset.push(" ");
  }
  return charset.slice(0, numClasses);
}

/**
 * Greedy CTC decode over one sequence of `steps × numClasses` starting at
 * `offset`. PP-OCR's recognition graph ends in a softmax, but if an export ever
 * hands back raw logits the per-step distribution is normalised so the reported
 * score stays a probability.
 */
export function ctcDecode(
  logits: Float32Array,
  steps: number,
  numClasses: number,
  charset: string[],
  offset = 0
): { text: string; score: number } {
  let text = "";
  let scoreSum = 0;
  let kept = 0;
  let previous = -1;

  for (let step = 0; step < steps; step += 1) {
    const base = offset + step * numClasses;
    let best = 0;
    let bestScore = logits[base];
    let total = 0;
    for (let index = 0; index < numClasses; index += 1) {
      const value = logits[base + index];
      total += value;
      if (value > bestScore) {
        bestScore = value;
        best = index;
      }
    }

    if (best !== 0 && best !== previous) {
      text += charset[best] ?? "";
      scoreSum += normaliseScore(logits, base, numClasses, bestScore, total);
      kept += 1;
    }
    previous = best;
  }

  return { score: kept === 0 ? 0 : scoreSum / kept, text };
}

const PROBABILITY_TOLERANCE = 0.01;

function normaliseScore(
  logits: Float32Array,
  base: number,
  numClasses: number,
  bestScore: number,
  total: number
): number {
  if (Math.abs(total - 1) <= PROBABILITY_TOLERANCE) {
    return bestScore;
  }
  let sum = 0;
  for (let index = 0; index < numClasses; index += 1) {
    sum += Math.exp(logits[base + index] - bestScore);
  }
  return 1 / sum;
}

/**
 * DBPostProcess, minus the rotated boxes: threshold the probability map, take
 * connected components, score each one the way `box_score_fast` does — the mean
 * probability across its bounding region, not just across the pixels that
 * cleared the threshold — then expand it by the distance pyclipper's unclip
 * would use for a rectangle.
 */
export function boxesFromProbMap(
  prob: Float32Array,
  width: number,
  height: number,
  scaleX: number,
  scaleY: number
): Box[] {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const boxes: Box[] = [];

  for (let seed = 0; seed < prob.length; seed += 1) {
    if (visited[seed] === 1 || prob[seed] < DET_THRESH) {
      continue;
    }

    const bounds = floodFill(prob, visited, queue, seed, width, height);
    const box = componentBox(prob, bounds, width, height);
    if (box) {
      boxes.push({
        x0: box.x0 * scaleX,
        x1: box.x1 * scaleX,
        y0: box.y0 * scaleY,
        y1: box.y1 * scaleY,
      });
      if (boxes.length >= DET_MAX_CANDIDATES) {
        break;
      }
    }
  }

  return boxes;
}

interface Bounds {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

/**
 * Iterative 8-connected flood fill, matching the connectivity `cv2.findContours`
 * uses for the foreground. `queue` is reused across components so a page-sized
 * probability map only allocates once.
 */
function floodFill(
  prob: Float32Array,
  visited: Uint8Array,
  queue: Int32Array,
  seed: number,
  width: number,
  height: number
): Bounds {
  visited[seed] = 1;
  queue[0] = seed;
  let head = 0;
  let tail = 1;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  while (head < tail) {
    const pixel = queue[head];
    head += 1;
    const x = pixel % width;
    const y = (pixel - x) / width;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    for (let dy = -1; dy <= 1; dy += 1) {
      const ny = y + dy;
      if (ny < 0 || ny >= height) {
        continue;
      }
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = x + dx;
        if (nx < 0 || nx >= width) {
          continue;
        }
        const neighbour = ny * width + nx;
        if (visited[neighbour] === 0 && prob[neighbour] >= DET_THRESH) {
          visited[neighbour] = 1;
          queue[tail] = neighbour;
          tail += 1;
        }
      }
    }
  }

  return { maxX, maxY, minX, minY };
}

/** Rejects the component or returns its unclipped box, in probability-map space. */
function componentBox(
  prob: Float32Array,
  bounds: Bounds,
  width: number,
  height: number
): Box | null {
  const { minX, minY, maxX, maxY } = bounds;
  const boxWidth = maxX - minX + 1;
  const boxHeight = maxY - minY + 1;
  // DBPostProcess drops thin components before unclipping, not after.
  if (Math.min(boxWidth, boxHeight) < MIN_BOX_SIDE) {
    return null;
  }
  if (regionScore(prob, bounds, width) < DET_BOX_THRESH) {
    return null;
  }

  // Same offset pyclipper gets for a rectangle: area * ratio / perimeter.
  const distance =
    (boxWidth * boxHeight * DET_UNCLIP_RATIO) / (2 * (boxWidth + boxHeight));
  const box = {
    x0: Math.max(0, Math.floor(minX - distance)),
    x1: Math.min(width, Math.ceil(maxX + 1 + distance)),
    y0: Math.max(0, Math.floor(minY - distance)),
    y1: Math.min(height, Math.ceil(maxY + 1 + distance)),
  };
  const tooSmall =
    Math.min(box.x1 - box.x0, box.y1 - box.y0) < UNCLIPPED_MIN_SIDE;
  return tooSmall ? null : box;
}

function regionScore(
  prob: Float32Array,
  bounds: Bounds,
  width: number
): number {
  let sum = 0;
  let count = 0;
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    const row = y * width;
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      sum += prob[row + x];
      count += 1;
    }
  }
  return count === 0 ? 0 : sum / count;
}

/**
 * Clusters lines into reading order: rows top to bottom, left to right within a
 * row. Each row is anchored on its first box so one tall box can't drag the
 * whole row's band down the page.
 */
export function groupRows(lines: OcrLine[]): OcrLine[][] {
  const sorted = [...lines].sort(
    (a, b) => a.box.y0 - b.box.y0 || a.box.x0 - b.box.x0
  );
  const rows: OcrLine[][] = [];

  for (const line of sorted) {
    const row = rows.at(-1);
    if (row && sharesRow(row[0].box, line.box)) {
      row.push(line);
    } else {
      rows.push([line]);
    }
  }

  for (const row of rows) {
    row.sort((a, b) => a.box.x0 - b.box.x0);
  }
  return rows;
}

function sharesRow(anchor: Box, box: Box): boolean {
  const overlap = Math.min(anchor.y1, box.y1) - Math.max(anchor.y0, box.y0);
  const shorter = Math.min(anchor.y1 - anchor.y0, box.y1 - box.y0);
  return shorter > 0 && overlap >= shorter * ROW_OVERLAP;
}

/** Joins lines into text, keeping one row of the image per output line. */
export function joinLines(lines: OcrLine[]): string {
  return groupRows(lines)
    .map((row) => row.map((line) => line.text).join(" "))
    .join("\n");
}

/* -------------------------------------------------------------------------- */
/* Runtime                                                                     */
/* -------------------------------------------------------------------------- */

export type Backend = "webgpu" | "wasm";

interface Engine {
  backend: Backend;
  det: InferenceSession;
  dict: string[];
  rec: InferenceSession;
}

let engine: Promise<Engine> | null = null;
// Latches once a WebGPU session has misbehaved, so a rebuild doesn't pick it
// again for the rest of the page's life.
let webgpuDisabled = false;

export function loadOcr(
  onProgress?: (progress: LoadProgress) => void
): Promise<Engine> {
  engine ??= createEngine(onProgress).catch((cause: unknown) => {
    // Don't cache the failure — a retry shouldn't need a page refresh.
    engine = null;
    throw cause;
  });
  return engine;
}

async function createEngine(
  onProgress?: (progress: LoadProgress) => void
): Promise<Engine> {
  const ort = await import("onnxruntime-web");
  // Threads need cross-origin isolation, which a static export doesn't get.
  // This is also the CPU fallback for ops the WebGPU EP can't take.
  ort.env.wasm.numThreads = 1;

  const [detBytes, recBytes, recConfig] = await Promise.all([
    download(DET_MODEL_URL, "detection model", onProgress),
    download(REC_MODEL_URL, "recognition model", onProgress),
    download(REC_CONFIG_URL, "character dictionary", onProgress),
  ]);

  const { backend, det, rec } = await createSessions(ort, detBytes, recBytes);

  return {
    backend,
    det,
    dict: parseCharDict(new TextDecoder().decode(recConfig)),
    rec,
  };
}

// The trailing "wasm" keeps any op the WebGPU EP can't compile on the CPU
// kernels instead of failing the whole session.
const WEBGPU_PROVIDERS = ["webgpu", "wasm"] as const;
const WASM_PROVIDERS = ["wasm"] as const;

type Providers = InferenceSession.SessionOptions["executionProviders"];

interface SessionPair {
  det: InferenceSession;
  rec: InferenceSession;
}

async function createPair(
  ort: typeof import("onnxruntime-web"),
  detBytes: Uint8Array,
  recBytes: Uint8Array,
  executionProviders: Providers
): Promise<SessionPair> {
  const [det, rec] = await Promise.all([
    ort.InferenceSession.create(detBytes, { executionProviders }),
    ort.InferenceSession.create(recBytes, { executionProviders }),
  ]);
  return { det, rec };
}

async function createSessions(
  ort: typeof import("onnxruntime-web"),
  detBytes: Uint8Array,
  recBytes: Uint8Array
): Promise<SessionPair & { backend: Backend }> {
  if (!webgpuDisabled && "gpu" in navigator) {
    const accelerated = await tryWebgpu(ort, detBytes, recBytes);
    if (accelerated) {
      return { backend: "webgpu", ...accelerated };
    }
  }

  const pair = await createPair(ort, detBytes, recBytes, WASM_PROVIDERS);
  return { backend: "wasm", ...pair };
}

/**
 * Builds both sessions on WebGPU and proves them before handing them back. A
 * missing adapter or an uncompilable shader throws here, but a bad kernel
 * doesn't — it quietly returns garbage — so each session gets a probe run
 * whose output has a known shape and range.
 */
async function tryWebgpu(
  ort: typeof import("onnxruntime-web"),
  detBytes: Uint8Array,
  recBytes: Uint8Array
): Promise<SessionPair | null> {
  let pair: SessionPair | null = null;

  try {
    pair = await createPair(ort, detBytes, recBytes, WEBGPU_PROVIDERS);
    if (await sessionsProduceSaneOutput(ort, pair.det, pair.rec)) {
      return pair;
    }
  } catch {
    // No adapter, device lost during init, or a shader that won't build.
  }

  webgpuDisabled = true;
  await releasePair(pair);
  return null;
}

function releasePair(pair: SessionPair | null): Promise<unknown> {
  if (!pair) {
    return Promise.resolve();
  }
  const swallow = () => undefined;
  return Promise.all([
    pair.det.release().catch(swallow),
    pair.rec.release().catch(swallow),
  ]);
}

// Small enough to be instant; the recognition probe uses the real 48x320 shape
// so its shaders are already compiled when the first crop arrives.
const PROBE_SIDE = 64;
const PROBE_TOLERANCE = 1e-3;

/**
 * A deterministic ramp over the range normalisation actually produces. Zeros
 * would be a weak probe: with no signal to carry, a convolution that dropped
 * its input entirely still emits its bias and looks healthy.
 */
function probeInput(length: number): Float32Array {
  const values = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    values[index] = ((index % BYTE_MAX) / BYTE_MAX - 0.5) * 2;
  }
  return values;
}

async function sessionsProduceSaneOutput(
  ort: typeof import("onnxruntime-web"),
  det: InferenceSession,
  rec: InferenceSession
): Promise<boolean> {
  const detShape = [1, 3, PROBE_SIDE, PROBE_SIDE] as const;
  const detOutput = await det.run({
    [det.inputNames[0]]: new ort.Tensor(
      "float32",
      probeInput(3 * PROBE_SIDE * PROBE_SIDE),
      detShape
    ),
  });
  // The DB head ends in a sigmoid, so every value must be a probability.
  if (!looksSane(detOutput[det.outputNames[0]].data, 1)) {
    return false;
  }

  const recShape = [1, 3, REC_HEIGHT, REC_BASE_WIDTH] as const;
  const recOutput = await rec.run({
    [rec.inputNames[0]]: new ort.Tensor(
      "float32",
      probeInput(3 * REC_HEIGHT * REC_BASE_WIDTH),
      recShape
    ),
  });
  // No range bound here — ctcDecode tolerates a logits export, so the probe
  // must too. Finite and non-empty is the real signal.
  return looksSane(recOutput[rec.outputNames[0]].data, null);
}

/**
 * Rejects the ways a broken GPU kernel actually fails: NaN/Infinity, values
 * outside a bounded activation's range, and an all-zero buffer that was never
 * written to. Both heads end in sigmoid/softmax, neither of which can emit an
 * exact zero, so an all-zero output means nothing ran.
 */
function looksSane(data: unknown, max: number | null): boolean {
  if (!(data instanceof Float32Array) || data.length === 0) {
    return false;
  }

  let nonZero = false;
  for (const value of data) {
    if (!Number.isFinite(value)) {
      return false;
    }
    const outOfRange =
      max !== null &&
      (value < -PROBE_TOLERANCE || value > max + PROBE_TOLERANCE);
    if (outOfRange) {
      return false;
    }
    if (value !== 0) {
      nonZero = true;
    }
  }
  return nonZero;
}

/**
 * Drops a WebGPU engine after it failed mid-run — a lost device or a shape
 * whose shaders won't build — so the caller can retry on CPU. The models come
 * straight back out of Cache Storage, so rebuilding is cheap.
 */
async function downgradeToWasm(): Promise<boolean> {
  const active = await engine?.catch(() => null);
  if (webgpuDisabled || active?.backend !== "webgpu") {
    return false;
  }

  webgpuDisabled = true;
  engine = null;
  await releasePair(active);
  return true;
}

const MODEL_CACHE = "ocr-models";

async function download(
  url: string,
  label: string,
  onProgress?: (progress: LoadProgress) => void
): Promise<Uint8Array> {
  // Storage can be unavailable (private mode, insecure context) or full; the
  // download still works without it.
  const cache = await openCache();
  const cached = await cache?.match(url).catch(() => undefined);
  const response = cached ?? (await fetch(url));

  if (!response.ok) {
    throw new Error(`Failed to download ${label} (${response.status})`);
  }
  if (!cached && cache) {
    await cache.put(url, response.clone()).catch(() => {
      // Out of quota — keep going with the in-memory copy.
    });
  }

  const total = Number(response.headers.get("content-length") ?? 0);
  const reader = response.body?.getReader();
  if (!reader) {
    return new Uint8Array(await response.arrayBuffer());
  }

  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    // biome-ignore lint/performance/noAwaitInLoops: reading a stream is inherently sequential
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
    loaded += value.length;
    onProgress?.({ file: label, loaded, total });
  }

  const bytes = new Uint8Array(loaded);
  let written = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, written);
    written += chunk.length;
  }
  return bytes;
}

async function openCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") {
    return null;
  }
  try {
    return await caches.open(MODEL_CACHE);
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Image plumbing                                                              */
/* -------------------------------------------------------------------------- */

let scratch: HTMLCanvasElement | null = null;

/** One reusable canvas — a dense page can produce hundreds of crops. */
function scratchContext(
  width: number,
  height: number
): CanvasRenderingContext2D {
  scratch ??= document.createElement("canvas");
  scratch.width = width;
  scratch.height = height;
  const context = scratch.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas 2D context unavailable");
  }
  // Resizing usually resets the canvas, but re-using the same dimensions may
  // not, and a rotated crop would otherwise leak its transform into the next
  // draw.
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);
  return context;
}

/**
 * Draws `crop` (or the whole source) scaled into a `width × height` bitmap.
 * `rotate` turns the crop a quarter turn counter-clockwise, matching the
 * `np.rot90` that get_rotate_crop_image applies to tall crops.
 */
function drawToPixels(
  source: CanvasImageSource,
  crop: Box | null,
  width: number,
  height: number,
  rotate = false
): ImageData {
  const context = scratchContext(width, height);
  if (!crop) {
    context.drawImage(source, 0, 0, width, height);
    return context.getImageData(0, 0, width, height);
  }

  const cropWidth = crop.x1 - crop.x0;
  const cropHeight = crop.y1 - crop.y0;
  if (rotate) {
    context.translate(0, height);
    context.rotate(-Math.PI / 2);
    context.drawImage(
      source,
      crop.x0,
      crop.y0,
      cropWidth,
      cropHeight,
      0,
      0,
      height,
      width
    );
  } else {
    context.drawImage(
      source,
      crop.x0,
      crop.y0,
      cropWidth,
      cropHeight,
      0,
      0,
      width,
      height
    );
  }
  return context.getImageData(0, 0, width, height);
}

/**
 * RGBA bytes to a normalised BGR CHW plane written at `offset`. PaddleOCR
 * decodes with `img_mode: BGR` and then applies the ImageNet mean in that
 * channel order, so mean[0] belongs to blue. Anything left untouched stays at
 * 0, which is exactly the zero padding `resize_norm_img` appends after
 * normalising.
 */
function writeTensor(
  pixels: ImageData,
  mean: readonly number[],
  std: readonly number[],
  target: Float32Array,
  offset: number,
  strideWidth: number
): void {
  const { width, height, data } = pixels;
  const plane = height * strideWidth;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const source = (y * width + x) * 4;
      const index = offset + y * strideWidth + x;
      target[index] = (data[source + 2] / BYTE_MAX - mean[0]) / std[0];
      target[plane + index] = (data[source + 1] / BYTE_MAX - mean[1]) / std[1];
      target[2 * plane + index] = (data[source] / BYTE_MAX - mean[2]) / std[2];
    }
  }
}

/** DetResizeForTest with limit_type 'max': cap the long side, snap to 32. */
function detectionSize(
  width: number,
  height: number
): { width: number; height: number } {
  const ratio = Math.min(1, DET_MAX_SIDE / Math.max(width, height));
  const snap = (value: number) =>
    Math.max(
      DET_SIZE_STEP,
      Math.round((value * ratio) / DET_SIZE_STEP) * DET_SIZE_STEP
    );
  return { height: snap(height), width: snap(width) };
}

/* -------------------------------------------------------------------------- */
/* Inference                                                                   */
/* -------------------------------------------------------------------------- */

export async function runOcr(
  image: ImageBitmap,
  onProgress?: (progress: LoadProgress) => void
): Promise<OcrResult> {
  if (image.width === 0 || image.height === 0) {
    return { lines: [], text: "" };
  }

  try {
    return await read(image, onProgress);
  } catch (cause) {
    // A GPU device can be lost long after the session was proved good. Rebuild
    // on CPU and read the image again rather than surfacing that to the user.
    if (await downgradeToWasm()) {
      return await read(image, onProgress);
    }
    throw cause;
  }
}

async function read(
  image: ImageBitmap,
  onProgress?: (progress: LoadProgress) => void
): Promise<OcrResult> {
  const { det, rec, dict } = await loadOcr(onProgress);
  const { Tensor } = await import("onnxruntime-web");

  const boxes = await detect(det, Tensor, image);
  const lines = await recognise(rec, Tensor, dict, image, boxes);
  const kept = lines.filter(
    (line) => line.text.length > 0 && line.score >= DROP_SCORE
  );

  return {
    lines: groupRows(kept).flat(),
    text: joinLines(kept),
  };
}

async function detect(
  det: InferenceSession,
  Tensor: typeof OrtTensor,
  image: ImageBitmap
): Promise<Box[]> {
  const size = detectionSize(image.width, image.height);
  const input = new Float32Array(3 * size.height * size.width);
  writeTensor(
    drawToPixels(image, null, size.width, size.height),
    DET_MEAN,
    DET_STD,
    input,
    0,
    size.width
  );

  const outputs = await det.run({
    [det.inputNames[0]]: new Tensor("float32", input, [
      1,
      3,
      size.height,
      size.width,
    ]),
  });
  const probMap = outputs[det.outputNames[0]];
  // Read the map's own dimensions rather than assuming the head is 1:1 with
  // the input.
  const mapWidth = probMap.dims.at(-1) ?? size.width;
  const mapHeight = probMap.dims.at(-2) ?? size.height;

  const found = boxesFromProbMap(
    probMap.data as Float32Array,
    mapWidth,
    mapHeight,
    image.width / mapWidth,
    image.height / mapHeight
  );

  // A tightly cropped word can defeat detection; read the whole frame instead
  // of returning nothing.
  return found.length > 0
    ? found
    : [{ x0: 0, x1: image.width, y0: 0, y1: image.height }];
}

interface Crop {
  aspect: number;
  box: Box;
  rotate: boolean;
}

async function recognise(
  rec: InferenceSession,
  Tensor: typeof OrtTensor,
  dict: string[],
  image: ImageBitmap,
  boxes: Box[]
): Promise<OcrLine[]> {
  const crops: Crop[] = boxes.map((box) => {
    const width = box.x1 - box.x0;
    const height = box.y1 - box.y0;
    const rotate = height / width >= VERTICAL_RATIO;
    const aspect = rotate ? height / width : width / height;
    return { aspect, box, rotate };
  });

  // PaddleOCR sorts by aspect ratio before batching so each batch pads to a
  // width close to its own widest crop.
  const order = crops
    .map((_, index) => index)
    .sort((a, b) => crops[a].aspect - crops[b].aspect);

  const lines: OcrLine[] = new Array(crops.length);
  let charset: string[] | null = null;

  for (let start = 0; start < order.length; start += REC_BATCH) {
    const batch = order.slice(start, start + REC_BATCH);
    const width = batchWidth(batch.map((index) => crops[index].aspect));
    const plane = REC_HEIGHT * width;
    const input = new Float32Array(batch.length * 3 * plane);

    for (const [slot, index] of batch.entries()) {
      const { box, rotate, aspect } = crops[index];
      const cropWidth = Math.min(
        width,
        Math.max(1, Math.ceil(REC_HEIGHT * aspect))
      );
      writeTensor(
        drawToPixels(image, box, cropWidth, REC_HEIGHT, rotate),
        REC_MEAN,
        REC_STD,
        input,
        slot * 3 * plane,
        width
      );
    }

    // biome-ignore lint/performance/noAwaitInLoops: batches share one session, so they must run in turn
    const outputs = await rec.run({
      [rec.inputNames[0]]: new Tensor("float32", input, [
        batch.length,
        3,
        REC_HEIGHT,
        width,
      ]),
    });
    const logits = outputs[rec.outputNames[0]];
    const [, steps, numClasses] = logits.dims;
    charset ??= buildCharset(dict, numClasses);
    const data = logits.data as Float32Array;

    for (const [slot, index] of batch.entries()) {
      const { text, score } = ctcDecode(
        data,
        steps,
        numClasses,
        charset,
        slot * steps * numClasses
      );
      lines[index] = { box: crops[index].box, score, text };
    }
  }

  return lines;
}

/** imgH * max_wh_ratio, floored at the export's 320 and snapped to 32. */
function batchWidth(aspects: number[]): number {
  const widest = Math.max(...aspects.map((aspect) => REC_HEIGHT * aspect));
  const snapped =
    Math.ceil(Math.max(REC_BASE_WIDTH, widest) / REC_WIDTH_STEP) *
    REC_WIDTH_STEP;
  return Math.min(REC_MAX_WIDTH, snapped);
}
