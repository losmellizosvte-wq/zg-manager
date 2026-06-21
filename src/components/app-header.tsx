import { SidebarTrigger } from "@/components/ui/sidebar";
import { FullLogo } from "@/components/logo";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
      <SidebarTrigger className="md:hidden" />
      <div className="hidden md:block">
        <FullLogo />
      </div>
      <div className="flex w-full items-center justify-end gap-4">
        {/* Placeholder for future elements like user menu */}
      </div>
    </header>
  );
}
