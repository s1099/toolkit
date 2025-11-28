import { pipeline } from "@huggingface/transformers";

export type OCRProcessor = (imageUrl: string) => Promise<string>;

export type OCRModel = {
  name: string;
  processor: () => Promise<OCRProcessor>;
};

type TesseractWorker = {
  setParameters: (parameters: {
    tessedit_char_whitelist: string;
  }) => Promise<void>;
  recognize: (image: string) => Promise<{ data: { text: string } }>;
};

type Tesseract = {
  createWorker: (
    lang?: string,
    workerCount?: number,
    options?: { langPath?: string }
  ) => Promise<TesseractWorker>;
};

declare global {
  // biome-ignore lint: Window is a built-in interface that needs augmentation
  interface Window {
    Tesseract?: Tesseract;
  }
}

function loadTesseractFromCDN(): Promise<Tesseract> {
  if (typeof window !== "undefined" && window.Tesseract) {
    return Promise.resolve(window.Tesseract);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = () => {
      if (window.Tesseract) {
        resolve(window.Tesseract);
      } else {
        reject(new Error("Tesseract failed to load"));
      }
    };
    script.onerror = () => {
      reject(new Error("Failed to load Tesseract"));
    };
    document.head.appendChild(script);
  });
}

async function tesseractProcessor(): Promise<OCRProcessor> {
  const tesseractLib = await loadTesseractFromCDN();
  const { createWorker } = tesseractLib;

  const worker = await createWorker("eng", 1, {
    langPath: "https://tessdata.projectnaptha.com/4.0.0_best",
  });

  return async (imageUrl: string): Promise<string> => {
    const {
      data: { text },
    } = await worker.recognize(imageUrl);
    return text.trim();
  };
}

async function trOCRProcessor(): Promise<OCRProcessor> {
  const ocr = await pipeline("image-to-text", "Xenova/trocr-small-printed");

  return async (imageUrl: string): Promise<string> => {
    const result = await ocr(imageUrl);
    const output: unknown = Array.isArray(result) ? result[0] : result;

    if (typeof output === "string") {
      return output.trim();
    }

    // Handle object output
    if (output && typeof output === "object" && output !== null) {
      const outputObj = output as Record<string, unknown>;
      let text = "";
      if ("generated_text" in outputObj) {
        text = String(outputObj.generated_text);
      } else if ("text" in outputObj) {
        text = String(outputObj.text);
      }
      return text.trim();
    }

    return "";
  };
}

export const MODELS: OCRModel[] = [
  {
    name: "Tesseract (Fast, Low Accuracy)",
    processor: tesseractProcessor,
  },
  // {
  //   name: "TrOCR (Slow, High Accuracy)",
  //   processor: trOCRProcessor,
  // },
];
