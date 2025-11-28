import {
  FileTextIcon,
  ImageMinusIcon,
  type LucideIcon,
  MaximizeIcon,
  MicIcon,
  Volume2Icon,
} from "lucide-react";

export type RouteGroup = {
  label: string;
  items: {
    title: string;
    slug: string;
    icon: LucideIcon;
  }[];
};

export const navGroups: RouteGroup[] = [
  {
    label: "Image",
    items: [
      {
        title: "OCR",
        slug: "ocr",
        icon: FileTextIcon,
      },
      {
        title: "Upscale",
        slug: "upscale",
        icon: MaximizeIcon,
      },
      {
        title: "Remove Background",
        slug: "remove-bg",
        icon: ImageMinusIcon,
      },
      // {
      //   title: "Remove Watermark",
      //   slug: "remove-watermark",
      //   icon: SparklesIcon,
      // },
    ],
  },
  {
    label: "Audio",
    items: [
      {
        title: "Transcribe",
        slug: "transcribe",
        icon: MicIcon,
      },
      {
        title: "TTS",
        slug: "tts",
        icon: Volume2Icon,
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
      },
    ],
  },
  //   {
  //     label: "Misc",
  //     items: [
  //       {
  //         title: "Shader Playground",
  //         slug: "shader-playground",
  //         icon: BoxIcon,
  //       },
  //     ],
  //   },
];
