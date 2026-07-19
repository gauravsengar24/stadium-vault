import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { ensureAuth } from "@/integrations/firebase/client";
import "./styles.css";

function boot() {
  const router = getRouter();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

ensureAuth().then(boot).catch(() => {
  console.warn("Firebase auth unavailable — continuing without authentication");
  boot();
});
