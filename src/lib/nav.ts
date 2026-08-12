import { Image01Icon, ScanImageIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export interface Tool {
  href: string;
  icon: IconSvgElement;
  name: string;
}

export interface Category {
  icon: IconSvgElement;
  name: string;
  tools: Tool[];
}

export const categories: Category[] = [
  {
    icon: Image01Icon,
    name: "Image",
    tools: [{ href: "/image/ocr", icon: ScanImageIcon, name: "OCR" }],
  },
];

export function findTool(pathname: string) {
  for (const category of categories) {
    const tool = category.tools.find((t) => t.href === pathname);
    if (tool) {
      return { category, tool };
    }
  }
  return null;
}
