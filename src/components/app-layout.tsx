import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { Toaster } from "@/components/ui/sonner";
import { useCookieBridgeListener } from "@/hooks/use-cookie-bridge";

export function AppLayout() {
  useCookieBridgeListener();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <a href="#main-content" className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-8">
          <div className="surface-enter mx-auto max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
