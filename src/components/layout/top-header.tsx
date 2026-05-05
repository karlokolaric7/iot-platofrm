"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    // Don't show workspace ID as a breadcrumb label
    if (seg.startsWith("ws-")) continue;
    crumbs.push({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
      href: path,
    });
  }
  return crumbs;
}

export function TopHeader() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4 mx-1" />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-1">
        {crumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {index > 0 && <span className="text-muted-foreground/40">/</span>}
            <span
              className={
                index === crumbs.length - 1
                  ? "text-foreground font-medium"
                  : "hover:text-foreground"
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
        {crumbs.length === 0 && (
          <span className="text-foreground font-medium">Home</span>
        )}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
