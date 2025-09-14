import { Outlet } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import {
  SidebarInset,
  SidebarProvider,
} from "../components/animate-ui/components/radix/sidebar";
import { AppSidebar } from "../components/app-sidebar";
import { Header } from "../components/header";
import { ThemeProvider } from "../providers/theme-provider";

export function AppLayout() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main>
            <Outlet />
            <Toaster position="top-center" />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
