import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import path from "path";

export default defineConfig({
  plugins: [
    remix({
      ssr: true,
      future: {
        unstable_optimizeDeps: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
    },
    mainFields: ["browser", "module", "main"],
  },
  ssr: {
    resolve: {
      conditions: ["worker", "browser"],
      externalConditions: ["worker"],
    },
    noExternal: true,
  },
  build: {
    minify: true,
  },
});
