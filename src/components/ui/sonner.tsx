import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * App toaster (shadcn-style, built on sonner). Mounted once at the root.
 * Uses richColors so success/error/warning get sensible tinted styles that
 * match the light theme.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-border shadow-soft",
        },
      }}
      {...props}
    />
  );
}
