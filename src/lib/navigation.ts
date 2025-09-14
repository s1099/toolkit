import {
  BoxIcon,
  FileTextIcon,
  ImageMinusIcon,
  MaximizeIcon,
  MicIcon,
  Volume2Icon,
} from "lucide-react";
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
        icon: FileTextIcon,
        element: ImageOcr,
      },
      {
        title: "Remove Background",
        slug: "remove-bg",
        icon: ImageMinusIcon,
        element: ImageRemoveBg,
      },
      {
        title: "Upscale",
        slug: "upscale",
        icon: MaximizeIcon,
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
        icon: MicIcon,
        element: AudioTranscribe,
      },
      {
        title: "TTS",
        slug: "tts",
        icon: Volume2Icon,
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
        icon: FileTextIcon,
        element: TextSummarize,
      },
    ],
  },
  {
    label: "Misc",
    items: [
      {
        title: "Shader Playground",
        slug: "shader-playground",
        icon: BoxIcon,
        element: TextSummarize,
      },
    ],
  },
];
