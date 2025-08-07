import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { ChevronDown, Upload } from "lucide-react";
import { useState } from "react";

export function ImageOcr() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("tesseract-fast");
  const [ocrText] = useState<string>("");

  const modelOptions: { value: string; label: string }[] = [
    { value: "tesseract-fast", label: "Tesseract Fast" },
    { value: "tesseract-legacy", label: "Tesseract Legacy" },
    { value: "easy-ocr", label: "EasyOCR" },
    { value: "paddle-ocr", label: "PaddleOCR" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">OCR</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model</CardTitle>
              <CardDescription>Choose an OCR model.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Label htmlFor="ocr-model">Model</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      id="ocr-model"
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
              <CardTitle>Extracted Text</CardTitle>
            </CardHeader>
            <CardContent>
              {ocrText ? (
                <pre className="bg-muted/50 border text-sm rounded-md p-4 whitespace-pre-wrap">
                  {ocrText}
                </pre>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Nothing here yet. Select a model and upload an image to begin.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
