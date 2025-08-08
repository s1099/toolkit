import { useState } from "react";
import { FileUploadCard } from "@/components/image/file-upload-card";
import {
  type ModelOption,
  ModelSelectCard,
} from "@/components/image/model-select-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ImageOcr() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("tesseract-fast");
  const [ocrText] = useState<string>("");

  const modelOptions: ModelOption[] = [
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
          <ModelSelectCard
            id="ocr-model"
            title="Model"
            description="Choose and manage OCR model."
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
