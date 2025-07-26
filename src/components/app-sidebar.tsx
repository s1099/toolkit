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
import { FileText, Image, Settings, Users } from "lucide-react";
import { NavLink } from "react-router";
import { ThemeToggle } from "./theme-toggle";

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
        title: "Upscale",
        url: "/image/upscale",
        icon: Image,
      },
    ],
  },
  {
    label: "test",
    items: [
      {
        title: "A",
        url: "/A",
        icon: Users,
      },
      {
        title: "B",
        url: "/B",
        icon: Settings,
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
        <ThemeToggle />
      </SidebarContent>
    </Sidebar>
  );
}
