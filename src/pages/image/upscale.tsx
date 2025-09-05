import { Download, Image as ImageIcon, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BeforeAfterSlider } from "@/components/image/before-after-slider";
import { FileUploadCard } from "@/components/image/file-upload-card";
import { type Model, ModelPicker } from "@/components/image/model-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ImageUpscale() {
  const [files, setFiles] = useState<File[]>([]);
  const [activeModel, setActiveModel] = useState<string>("realesrgan-4x");
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
    setIsProcessing(Boolean(activeModel));
    setUpscaledUrl(null);
    // TODO: actually upscale the image
    const timer = window.setTimeout(() => {
      setUpscaledUrl(originalUrl);
      setIsProcessing(false);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [originalUrl, activeModel]);

  const models: Model[] = [
    {
      id: "realesrgan-4x",
      name: "Real-ESRGAN 4x",
      size: "3.4 GB",
      status: "available",
      description: "Real-ESRGAN 4x upscaling model",
    },
    {
      id: "swinir-4x",
      name: "SwinIR 4x",
      size: "4.1 GB",
      status: "available",
      description: "SwinIR 4x upscaling model",
    },
    {
      id: "esrgan-anime-4x",
      name: "ESRGAN Anime 4x",
      size: "2.8 GB",
      status: "available",
      description: "ESRGAN Anime 4x upscaling model",
    },
    {
      id: "waifu2x-2x",
      name: "Waifu2x 2x",
      size: "1.6 GB",
      status: "available",
      description: "Waifu2x 2x upscaling model",
    },
  ];

  const canDownload = Boolean(upscaledUrl) && !isProcessing;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upscale</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ModelPicker
            {...{ activeModel, setActiveModel }}
            availableModels={models}
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
                      {models.find((m) => m.id === activeModel)?.name}
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
