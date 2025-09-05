import { useState } from "react";
import { FileUploadCard } from "@/components/image/file-upload-card";
import { type Model, ModelPicker } from "@/components/image/model-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ImageOcr() {
  const [files, setFiles] = useState<File[]>([]);
  const [activeModel, setActiveModel] = useState<string>("tesseract-fast");
  const [ocrText] = useState<string>("");

  const models: Model[] = [
    {
      id: "tesseract-fast",
      name: "Tesseract Fast",
      size: "2.1 GB",
      status: "available",
      description: "Fast OCR model",
    },
    {
      id: "tesseract-legacy",
      name: "Tesseract Legacy",
      size: "1.8 GB",
      status: "available",
      description: "Legacy OCR model",
    },
    {
      id: "easy-ocr",
      name: "EasyOCR",
      size: "4.7 GB",
      status: "available",
      description: "Open source OCR model",
    },
    {
      id: "paddle-ocr",
      name: "PaddleOCR",
      size: "1.2 GB",
      status: "available",
      description: "PaddleOCR OCR model",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">OCR</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ModelPicker
            {...{ activeModel, setActiveModel }}
            availableModels={models}
          />

          <FileUploadCard
            title="Upload Image"
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
