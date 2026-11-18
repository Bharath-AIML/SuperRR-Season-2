import { defineConfig } from '@playwright/test'
import { homedir } from 'node:os'
import { existsSync } from 'node:fs'
const full = `${homedir()}/.cache/ms-playwright/chromium-1148/chrome-linux/chrome` // full Chromium (works without the separate headless shell)
export default defineConfig({
  testDir: './e2e', timeout: 60_000, retries: 0, reporter: [['list'], ['json', { outputFile: 'qa-results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, launchOptions: existsSync(full) ? { executablePath: full } : {} },
  webServer: { command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: true, timeout: 120_000 },
})
