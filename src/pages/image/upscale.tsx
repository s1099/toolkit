import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import {
  ChevronDown,
  ChevronsLeftRight,
  Download,
  Image as ImageIcon,
  Upload,
  Wand2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function BeforeAfterSlider(props: {
  beforeSrc: string;
  afterSrc: string;
  initialPosition?: number; // 0..1
}) {
  const { beforeSrc, afterSrc, initialPosition = 0.5 } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<number>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  const clamp = (val: number) => Math.min(1, Math.max(0, val));

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = (clientX - rect.left) / rect.width;
    setPosition(clamp(next));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    updateFromClientX(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => updateFromClientX(e.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, updateFromClientX]);

  const leftPercent = useMemo(() => position * 100, [position]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[260px] md:min-h-[420px] overflow-hidden rounded-md border bg-muted/30 select-none"
      onPointerDown={onPointerDown}
      role="region"
      aria-label="Before and after comparison. Drag the handle to reveal."
    >
      <img
        src={beforeSrc}
        alt="Before"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />

      <img
        src={afterSrc}
        alt="After"
        className="absolute inset-0 h-full w-full object-contain"
        style={{ clipPath: `inset(0 ${100 - leftPercent}% 0 0)` }}
        draggable={false}
      />

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-border"
        style={{ left: `calc(${leftPercent}% - 1px)` }}
        aria-hidden
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-background/80 backdrop-blur border shadow-sm flex items-center justify-center cursor-col-resize">
            <ChevronsLeftRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium shadow-sm border">
        Before
      </div>
      <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium shadow-sm border">
        After
      </div>
    </div>
  );
}

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
    setIsProcessing(true);
    setUpscaledUrl(null);
    const timer = window.setTimeout(() => {
      setUpscaledUrl(originalUrl);
      setIsProcessing(false);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [originalUrl, selectedModel]);

  const modelOptions: { value: string; label: string }[] = [
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
          <Card>
            <CardHeader>
              <CardTitle>Model</CardTitle>
              <CardDescription>Choose an upscaling model.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Label htmlFor="upscale-model">Model</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      id="upscale-model"
                      variant="outline"
                      className="min-w-48 justify-between"
                    >
                      <span>
                        {modelOptions.find((m) => m.value === selectedModel)
                          ?.label ?? selectedModel}
                      </span>
                      <ChevronDown className="size-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-48">
                    <DropdownMenuRadioGroup
                      value={selectedModel}
                      onValueChange={(val) => setSelectedModel(val)}
                    >
                      {modelOptions.map((m) => (
                        <DropdownMenuRadioItem key={m.value} value={m.value}>
                          {m.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>
                Drag and drop or browse to upload.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                value={files}
                onValueChange={setFiles}
                accept="image/*"
                className="w-full"
              >
                <FileUploadDropzone>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center rounded-full border p-2.5">
                      <Upload className="size-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-sm">
                      Drag & drop files here
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Or click to browse
                    </p>
                  </div>
                  <FileUploadTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2 w-fit">
                      Browse files
                    </Button>
                  </FileUploadTrigger>
                </FileUploadDropzone>
              </FileUpload>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Result</CardTitle>
                {canDownload ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={upscaledUrl!} download>
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
