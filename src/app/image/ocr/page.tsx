"use client";

import { Check, Copy, FileImage, ScanText, Upload, X, Zap } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODELS } from "./models";

export default function OCRTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].name);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!(selectedFile && previewUrl)) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedText("");

    try {
      const model = MODELS.find((m) => m.name === selectedModel);
      if (!model) {
        throw new Error("Selected model not found");
      }
      const processor = await model.processor();
      const text = await processor(selectedFile);
      setExtractedText(text);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedText("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-lg text-zinc-800">
              <Upload className="h-4 w-4" />
              Input Image
            </h2>
            {selectedFile && (
              <Button
                className="text-zinc-500"
                onClick={clearFile}
                size="sm"
                variant="ghost"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="font-medium text-xs text-zinc-500 uppercase tracking-wider">
              Model
            </Label>
            <Select onValueChange={setSelectedModel} value={selectedModel}>
              <SelectTrigger size="lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-h-[300px] flex-1 flex-col gap-4">
            {previewUrl ? (
              <div className="group relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900">
                <img
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                  height={650}
                  src={previewUrl}
                  width={500}
                />
                <button
                  className="absolute top-2 right-2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                  onClick={clearFile}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                className="group relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-zinc-200 border-dashed bg-zinc-50/50 transition-all hover:border-zinc-300 hover:bg-zinc-50"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  type="file"
                />
                <div className="mb-4 rounded-full bg-zinc-100 p-4 transition-transform group-hover:scale-110">
                  <FileImage className="h-8 w-8 text-zinc-400" />
                </div>
                <p className="font-medium text-sm text-zinc-700">
                  Click to upload image
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  JPG, JPEG, PNG, WEBP, BMP, TIFF, ICO
                </p>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="h-11 w-full"
              disabled={!selectedFile || isProcessing}
              onClick={handleExtract}
            >
              {isProcessing ? "Extracting..." : "Extract Text"}
            </Button>
            {error && <p className="mt-1 text-red-500 text-xs">{error}</p>}
          </div>
        </div>

        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-lg text-zinc-800">
              <ScanText className="h-4 w-4" />
              Extracted Text
            </h2>
          </div>

          <div className="relative flex-1">
            <textarea
              className={`h-full w-full resize-none rounded-xl border bg-white p-6 text-zinc-800 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 ${extractedText ? "border-zinc-200 shadow-sm" : "border-zinc-100 text-zinc-400"}`}
              placeholder={
                isProcessing
                  ? "Analysing image..."
                  : "Text extracted from the image will appear here..."
              }
              readOnly
              style={{ fontFamily: "monospace" }}
              value={extractedText}
            />

            <div className="absolute top-3 right-3">
              <Button
                className="border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm hover:bg-zinc-50"
                disabled={!extractedText}
                onClick={handleCopy}
                size="sm"
                variant="outline"
              >
                {copied ? (
                  <Check className="mr-1 h-3 w-3" />
                ) : (
                  <Copy className="mr-1 h-3 w-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <Zap className="h-8 w-8 animate-pulse text-zinc-900" />
                  <p className="font-medium text-sm text-zinc-600">
                    Processing...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
