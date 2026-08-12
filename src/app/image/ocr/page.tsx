"use client";

import {
  Alert02Icon,
  Copy01Icon,
  ImageUpload01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { type DragEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LoadProgress, OcrResult } from "@/lib/ocr";

type Preview = { url: string; width: number; height: number; name: string };

const PERCENT = 100;

export default function OcrPage() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [progress, setProgress] = useState<Record<string, LoadProgress>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const downloads = Object.values(progress);
  const downloaded = downloads.reduce((sum, item) => sum + item.loaded, 0);
  const downloadTotal = downloads.reduce((sum, item) => sum + item.total, 0);
  const pending = busy && downloadTotal > 0 && downloaded < downloadTotal;

  const handleFile = async (file: File | undefined) => {
    if (!file?.type.startsWith("image/")) {
      setError("That file isn't an image.");
      return;
    }

    setError(null);
    setResult(null);
    setBusy(true);

    const bitmap = await createImageBitmap(file);
    setPreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous.url);
      }
      return {
        height: bitmap.height,
        name: file.name,
        url: URL.createObjectURL(file),
        width: bitmap.width,
      };
    });

    try {
      const { runOcr } = await import("@/lib/ocr");
      setResult(
        await runOcr(bitmap, (item) =>
          setProgress((previous) => ({ ...previous, [item.file]: item }))
        )
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Recognition failed.");
    } finally {
      setBusy(false);
      bitmap.close();
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files[0]);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result?.text ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-2 md:overflow-hidden">
      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-heading font-semibold text-lg">OCR</h1>
          <Button onClick={() => inputRef.current?.click()} size="sm">
            <HugeiconsIcon icon={ImageUpload01Icon} strokeWidth={2} />
            Choose image
          </Button>
        </div>

        <input
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />

        {/** biome-ignore lint/a11y/noStaticElementInteractions: drop target, the button above is the keyboard path */}
        <div
          className="flex min-h-48 flex-1 items-center justify-center overflow-auto rounded-xl border border-dashed bg-muted/30 p-3"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          {preview ? (
            <Image
              alt={preview.name}
              className="h-auto max-h-full w-auto max-w-full object-contain"
              height={preview.height}
              src={preview.url}
              unoptimized
              width={preview.width}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Drop an image here, or choose one above.
            </p>
          )}
        </div>
      </section>

      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex h-8 items-center justify-between gap-2">
          <span className="text-muted-foreground text-sm">
            {result ? `${result.lines.length} lines` : "Extracted text"}
          </span>
          {result && result.text.length > 0 && (
            <Button onClick={copy} size="sm" variant="outline">
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm">
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
            {error}
          </p>
        )}

        {busy && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <HugeiconsIcon
              className="animate-spin"
              icon={Loading03Icon}
              strokeWidth={2}
            />
            {pending
              ? `Downloading models… ${Math.round((downloaded / downloadTotal) * PERCENT)}%`
              : "Reading image…"}
          </div>
        )}

        <Textarea
          className="min-h-48 flex-1 resize-none font-mono text-sm"
          placeholder="Text from the image shows up here."
          readOnly
          value={result?.text ?? ""}
        />
      </section>
    </div>
  );
}
