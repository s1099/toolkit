import { Download, Image as ImageIcon, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BeforeAfterSlider } from "@/components/image/before-after-slider";
import { FileUploadCard } from "@/components/image/file-upload-card";
import {
  type ModelOption,
  ModelSelectCard,
} from "@/components/image/model-select-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ImageUpscale() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("realesrgan-4x");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    let previousUrl: string | null = null;
    if (files[0]) {
      const url = URL.createObjectURL(files[0]);
      previousUrl = url;
      setOriginalUrl(url);
      setUpscaledUrl(null);
    } else {
      setOriginalUrl(null);
      setUpscaledUrl(null);
    }
    return () => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
    };
  }, [files]);

  useEffect(() => {
    if (!originalUrl) return;
    setIsProcessing(Boolean(selectedModel));
    setUpscaledUrl(null);
    const timer = window.setTimeout(() => {
      setUpscaledUrl(originalUrl);
      setIsProcessing(false);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [originalUrl, selectedModel]);

  const modelOptions: ModelOption[] = [
    { value: "realesrgan-4x", label: "Real-ESRGAN 4x" },
    { value: "swinir-4x", label: "SwinIR 4x" },
    { value: "esrgan-anime-4x", label: "ESRGAN Anime 4x" },
    { value: "waifu2x-2x", label: "Waifu2x 2x" },
  ];

  const canDownload = Boolean(upscaledUrl) && !isProcessing;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upscale</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ModelSelectCard
            id="upscale-model"
            title="Model"
            description="Choose an upscaling model."
            selected={selectedModel}
            onChange={setSelectedModel}
            options={modelOptions}
          />

          <FileUploadCard
            title="Upload Image"
            description="Drag and drop or browse to upload."
            files={files}
            onFilesChange={setFiles}
            accept="image/*"
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Result</CardTitle>
                {canDownload ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={upscaledUrl ?? undefined} download>
                      <Download className="size-4" />
                      Download
                    </a>
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {originalUrl ? (
                <div className="space-y-3">
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wand2 className="size-4 animate-pulse" />
                      Processing with{" "}
                      {
                        modelOptions.find((m) => m.value === selectedModel)
                          ?.label
                      }
                      ...
                    </div>
                  )}
                  {upscaledUrl ? (
                    <BeforeAfterSlider
                      beforeSrc={originalUrl}
                      afterSrc={upscaledUrl}
                    />
                  ) : (
                    <div className="relative w-full min-h-[260px] md:min-h-[420px] overflow-hidden rounded-md border bg-muted/50">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-1/2 w-2/3 max-w-[560px] rounded-md bg-background/80 border shadow-sm animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-md border bg-muted/30 py-16">
                  <div className="rounded-full border p-3">
                    <ImageIcon className="size-6 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium">No image yet</p>
                    <p className="text-muted-foreground text-sm">
                      Choose a model and upload an image to preview the upscaled
                      result.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
