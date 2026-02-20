import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppBreadcrumbs } from "./app-breadcrumbs";

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-white px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="!h-4" />
      <AppBreadcrumbs />
    </header>
  );
}
