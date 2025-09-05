import {
  FileText,
  ImageMinus,
  Maximize,
  Mic,
  ToolCaseIcon,
  Volume2,
} from "lucide-react";
import { NavLink } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
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
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <NavLink to="/">
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <ToolCaseIcon />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Toolkit</span>
            </div>
          </SidebarMenuButton>
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
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
