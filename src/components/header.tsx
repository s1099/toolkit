"use client";

import { HomeIcon, SearchIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { navGroups } from "@/lib/nav";

function getBreadcrumbFromPath(pathname: string) {
  if (pathname === "/") {
    return { groupLabel: null, itemTitle: "Home" };
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return { groupLabel: null, itemTitle: null };
  }

  const [groupSlug, itemSlug] = segments;
  const group = navGroups.find(
    (g) => g.label.toLowerCase() === groupSlug.toLowerCase()
  );

  if (!group) {
    return { groupLabel: null, itemTitle: null };
  }

  const item = group.items.find(
    (i) => i.slug.toLowerCase() === itemSlug.toLowerCase()
  );

  if (!item) {
    return { groupLabel: group.label, itemTitle: null };
  }

  return { groupLabel: group.label, itemTitle: item.title };
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumb = useMemo(() => getBreadcrumbFromPath(pathname), [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prevOpen) => !prevOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 overflow-hidden rounded-t-xl border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-2 sm:px-4">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator
            className="mr-2 shrink-0 data-[orientation=vertical]:h-4"
            orientation="vertical"
          />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="min-w-0">
              {breadcrumb.groupLabel && (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    {breadcrumb.groupLabel}
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                </>
              )}
              {breadcrumb.itemTitle && (
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate">
                    {breadcrumb.itemTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 px-2 sm:gap-2 sm:px-4">
          <Button
            className="relative h-9 shrink-0 justify-start gap-2 text-muted-foreground sm:w-64 sm:pr-12"
            onClick={() => setOpen(true)}
            variant="outline"
          >
            <SearchIcon className="size-4 shrink-0" />
            <span className="hidden sm:inline-flex">Search...</span>
            <span className="inline-flex sm:hidden">Search</span>
            <KbdGroup className="pointer-events-none absolute top-1.5 right-1.5 hidden items-center gap-1 sm:flex">
              <Kbd>
                {typeof window !== "undefined" &&
                navigator.platform.toUpperCase().indexOf("MAC") >= 0
                  ? "⌘"
                  : "Ctrl"}
              </Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <CommandDialog onOpenChange={setOpen} open={open}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => {
                router.push("/");
                setOpen(false);
              }}
            >
              <HomeIcon />
              <span>Home</span>
            </CommandItem>
          </CommandGroup>
          {navGroups.map((group) => (
            <CommandGroup heading={group.label} key={group.label}>
              {group.items.map((item) => {
                const href = `/${group.label.toLowerCase()}/${item.slug}`;
                return (
                  <CommandItem
                    key={item.title}
                    onSelect={() => {
                      router.push(href);
                      setOpen(false);
                    }}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
