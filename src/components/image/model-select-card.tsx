import { ChevronDown, Download, Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { deleteModel, hasModel, putModel } from "@/lib/model-idb";

export type ModelOption = { value: string; label: string };

type ModelSelectCardProps = {
  id: string;
  title: string;
  description: string;
  selected: string;
  onChange: (value: string) => void;
  options: ModelOption[];
};

export function ModelSelectCard(props: ModelSelectCardProps) {
  const { id, title, description, selected, onChange, options } = props;

  const selectedLabel = useMemo(() => {
    if (!selected) return "Choose a model";
    return options.find((m) => m.value === selected)?.label ?? selected;
  }, [options, selected]);

  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>(
    {}
  );
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>(
    {}
  );
  const [currentDownloading, setCurrentDownloading] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        options.map(
          async (opt) => [opt.value, await hasModel(opt.value)] as const
        )
      );
      if (!cancelled) {
        setDownloadedMap(Object.fromEntries(entries));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [options]);

  // Ensure current selection is always a downloaded model
  useEffect(() => {
    if (!options.length) return;
    const mapReady = Object.keys(downloadedMap).length === options.length;
    if (!mapReady) return;
    const isSelectedDownloaded = selected ? downloadedMap[selected] : false;
    if (!isSelectedDownloaded) {
      const firstDownloaded =
        options.find((opt) => downloadedMap[opt.value])?.value ?? "";
      if (firstDownloaded !== selected) onChange(firstDownloaded);
    }
  }, [downloadedMap, options, selected, onChange]);

  async function handleDownload(value: string, label?: string) {
    if (currentDownloading) return;
    if (isDownloading[value]) return;
    setIsDownloading((m) => ({ ...m, [value]: true }));
    setDownloadProgress((m) => ({ ...m, [value]: 0 }));
    setCurrentDownloading(value);

    const preferredUrl = "http://localhost:5173/toolkit/vite.svg";
    try {
      let res = await fetch(preferredUrl);
      if (!res.ok) {
        // fallback to vite public path
        res = await fetch("/vite.svg");
      }
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const contentLengthHeader = res.headers.get("Content-Length");
      const total = contentLengthHeader ? Number(contentLengthHeader) : 0;
      const reader = res.body?.getReader();
      if (reader) {
        const chunks: Uint8Array[] = [];
        let received = 0;
        let approx = 0;
        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          if (chunk) {
            chunks.push(chunk);
            received += chunk.length;
            if (total > 0) {
              const pct = Math.min(100, Math.round((received / total) * 100));
              setDownloadProgress((m) => ({ ...m, [value]: pct }));
            } else {
              approx = Math.min(95, approx + 5);
              setDownloadProgress((m) => ({ ...m, [value]: approx }));
            }
          }
        }
        const blob = new Blob(chunks, {
          type: res.headers.get("Content-Type") ?? "application/octet-stream",
        });
        await putModel({
          value,
          label,
          blob,
          size: blob.size,
          createdAt: Date.now(),
        });
      } else {
        const blob = await res.blob();
        await putModel({
          value,
          label,
          blob,
          size: blob.size,
          createdAt: Date.now(),
        });
      }
      setDownloadedMap((m) => ({ ...m, [value]: true }));
      setDownloadProgress((m) => ({ ...m, [value]: 100 }));
    } catch (err) {
      console.error(err);
      setDownloadProgress((m) => ({ ...m, [value]: 0 }));
    } finally {
      setIsDownloading((m) => ({ ...m, [value]: false }));
      setCurrentDownloading((v) => (v === value ? null : v));
      // reset progress bar after a short delay
      setTimeout(() => {
        setDownloadProgress((m) => {
          const { [value]: _, ...rest } = m;
          return rest;
        });
      }, 700);
    }
  }

  async function handleDelete(value: string) {
    try {
      await deleteModel(value);
      setDownloadedMap((m) => ({ ...m, [value]: false }));
      if (selected === value) {
        const next =
          options.find(
            (o) => o.value !== value && (downloadedMap[o.value] ?? false)
          )?.value ?? "";
        if (next !== selected) onChange(next);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Label htmlFor={id}>Model</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id={id}
                variant="outline"
                className="min-w-56 justify-between"
              >
                <span className="truncate max-w-[200px]">{selectedLabel}</span>
                <ChevronDown className="size-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[20rem] p-0">
              {options.map((opt, idx) => {
                const isActive = selected === opt.value;
                const downloaded = downloadedMap[opt.value];
                const progress = downloadProgress[opt.value] ?? 0;
                const downloading = isDownloading[opt.value] ?? false;
                return (
                  <div key={opt.value}>
                    <DropdownMenuItem
                      className="px-2 py-2"
                      onSelect={(e) => {
                        if (!downloaded) {
                          e.preventDefault();
                          return;
                        }
                        if (!isActive) onChange(opt.value);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`size-2 rounded-full ${
                              isActive ? "bg-primary" : "bg-muted-foreground/40"
                            }`}
                          />
                          <span className="text-sm truncate">{opt.label}</span>
                          {downloaded ? (
                            <Badge variant="secondary" className="h-5">
                              Installed
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {downloaded ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Delete ${opt.label}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void handleDelete(opt.value);
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Download ${opt.label}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void handleDownload(opt.value, opt.label);
                              }}
                              disabled={
                                downloading ||
                                (currentDownloading !== null &&
                                  currentDownloading !== opt.value)
                              }
                            >
                              {downloading ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Download className="size-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    {currentDownloading === opt.value ? (
                      <div className="relative mt-2">
                        <div className="h-px w-full bg-border overflow-hidden">
                          <div
                            className="h-px bg-primary transition-[width] duration-150 ease-linear"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, Math.round(progress))
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : idx < options.length - 1 ? (
                      <div className="h-px w-full bg-border/60" />
                    ) : null}
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
