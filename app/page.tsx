"use client";

import { redirect } from "next/navigation";
import { EmptyModules } from "@/views/empty-modules";
import { defaultModuleId } from "@/modules/registry";

export default function HomePage() {
  if (defaultModuleId) redirect(`/module/${defaultModuleId}`);
  return <EmptyModules />;
}
