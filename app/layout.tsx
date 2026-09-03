import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppLayout } from "@/components/app-layout";
import "@/index.css";

export const metadata: Metadata = {
  title: "AEM Operations",
  description: "Samsung AEM automation workspace",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body><AppLayout>{children}</AppLayout></body>
    </html>
  );
}
