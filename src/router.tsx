import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
import { ModulePage } from "@/pages/module-page";
import { EmptyModules } from "@/pages/empty-modules";
import { defaultModuleId } from "@/modules/registry";

/** Object-based route config. Modules are addressable as `/module/:moduleId`. */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: defaultModuleId ? (
          <Navigate to={`/module/${defaultModuleId}`} replace />
        ) : (
          <EmptyModules />
        ),
      },
      { path: "module/:moduleId", element: <ModulePage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
