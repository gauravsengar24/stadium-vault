import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function inlineCssPlugin() {
  return {
    name: "inline-css",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const htmlPath = path.resolve(dist, "index.html");
      if (!fs.existsSync(htmlPath)) return;
      let html = fs.readFileSync(htmlPath, "utf-8");

      // Inline CSS: replace <link rel="stylesheet"> with inline <style>
      html = html.replace(
        /<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/,
        (_, href) => {
          const cssPath = path.resolve(dist, href.replace(/^\//, ""));
          if (!fs.existsSync(cssPath)) return _;
          const css = fs.readFileSync(cssPath, "utf-8");
          try { fs.unlinkSync(cssPath); } catch {}
          return `<style>${css}</style>`;
        },
      );

      // Remove duplicate dns-prefetch for fonts
      const seen = new Set();
      html = html.replace(
        /<link rel="dns-prefetch"[^>]*>/g,
        (match) => {
          if (seen.has(match)) return "";
          seen.add(match);
          return match;
        },
      );

      fs.writeFileSync(htmlPath, html);
    },
  };
}

export default defineConfig({
  plugins: [
    tanstackRouter({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    inlineCssPlugin(),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
  },
  build: {
    target: "esnext",
    cssMinify: "lightningcss",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack/react-router")) {
            return "vendor-router";
          }
          if (id.includes("node_modules/@supabase/supabase-js")) {
            return "vendor-supabase";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-lucide";
          }
          if (id.includes("node_modules/sonner")) {
            return "vendor-sonner";
          }
        },
      },
    },
  },
});
