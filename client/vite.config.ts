import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vitest/config";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const apiProxyTarget = process.env.MJPS_API_PROXY_TARGET ?? "http://127.0.0.1:8765";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    fs: {
      allow: [clientRoot, path.resolve(clientRoot, "../docs")]
    },
    proxy: {
      "/api": apiProxyTarget
    }
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: "./tests/setup.ts"
  }
});
