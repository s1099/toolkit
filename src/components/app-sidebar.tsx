import {
  FileText,
  ImageMinus,
  Maximize,
  Mic,
  Volume2,
} from "lucide-react";
import { NavLink } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavSection {
  label: string;
  items: {
    title: string;
    url: string;
    icon: React.ElementType;
  }[];
}

const groups: NavSection[] = [
  {
    label: "Image",
    items: [
      {
        title: "OCR",
        url: "/image/ocr",
        icon: FileText,
      },
      {
        title: "Remove Background",
        url: "/image/remove-bg",
        icon: ImageMinus,
      },
      {
        title: "Upscale",
        url: "/image/upscale",
        icon: Maximize,
      },
    ],
  },
  {
    label: "Audio",
    items: [
      {
        title: "Transcribe",
        url: "/audio/transcribe",
        icon: Mic,
      },
      {
        title: "TTS",
        url: "/audio/tts",
        icon: Volume2,
      },
    ],
  },
  {
    label: "Text",
    items: [
      {
        title: "Summarize",
        url: "/text/summarize",
        icon: FileText,
      },
    ],
  },
];

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
