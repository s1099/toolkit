import { FileText, ImageMinus, Maximize, Mic, Volume2 } from "lucide-react";
import {
  AudioTranscribe,
  AudioTts,
  ImageOcr,
  ImageRemoveBg,
  ImageUpscale,
  TextSummarize,
} from "../pages";

export interface RouteGroup {
  label: string;
  items: {
    title: string;
    slug: string;
    icon: React.ElementType;
    element: React.ComponentType;
  }[];
}

export const navGroups: RouteGroup[] = [
  {
    label: "Image",
    items: [
      {
        title: "OCR",
        slug: "ocr",
        icon: FileText,
        element: ImageOcr,
      },
      {
        title: "Remove Background",
        slug: "remove-bg",
        icon: ImageMinus,
        element: ImageRemoveBg,
      },
      {
        title: "Upscale",
        slug: "upscale",
        icon: Maximize,
        element: ImageUpscale,
      },
    ],
  },
  {
    label: "Audio",
    items: [
      {
        title: "Transcribe",
        slug: "transcribe",
        icon: Mic,
        element: AudioTranscribe,
      },
      {
        title: "TTS",
        slug: "tts",
        icon: Volume2,
        element: AudioTts,
      },
    ],
  },
  {
    label: "Text",
    items: [
      {
        title: "Summarize",
        slug: "summarize",
        icon: FileText,
        element: TextSummarize,
      },
    ],
  },
];
