import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, "..");
const e2eDataDir = path.join(repoRoot, ".tmp", `e2e-data-${Date.now()}`);
const localVenvPython = path.join(repoRoot, ".venv", "bin", "python");
const pythonCommand =
  process.env.MJPS_E2E_PYTHON ?? (fs.existsSync(localVenvPython) ? localVenvPython : "python");
const apiPort = e2ePort("MJPS_E2E_API_PORT", 8765);
const clientPort = e2ePort("MJPS_E2E_CLIENT_PORT", 5173);
const apiUrl = `http://127.0.0.1:${apiPort}`;
const clientUrl = `http://127.0.0.1:${clientPort}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: clientUrl,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command: `${pythonCommand} -m mj_prompt_studio.server.main`,
      cwd: repoRoot,
      env: {
        MJPS_DATA_DIR: e2eDataDir,
        MJPS_LLM_MODE: "mock",
        MJPS_SERVER_PORT: String(apiPort),
        MJPS_CORS_ORIGINS: clientUrl
      },
      url: `${apiUrl}/api/health`,
      reuseExistingServer: false,
      timeout: 30_000
    },
    {
      command: `MJPS_API_PROXY_TARGET=${apiUrl} npm run dev -- --host 127.0.0.1 --port ${clientPort}`,
      url: clientUrl,
      reuseExistingServer: false,
      timeout: 30_000
    }
  ]
});

function e2ePort(name: string, fallback: number): number {
  const configured = process.env[name];
  if (!configured) {
    return fallback;
  }
  if (!/^\d+$/.test(configured)) {
    throw new Error(`${name} must be a numeric local port.`);
  }
  const port = Number(configured);
  if (port < 1024 || port > 65_535) {
    throw new Error(`${name} must be between 1024 and 65535.`);
  }
  return port;
}
