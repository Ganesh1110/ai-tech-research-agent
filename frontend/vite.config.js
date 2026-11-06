import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")

export default defineConfig(({ mode }) => {
  // Load env from repository root where .env is stored
  const rootEnv = loadEnv(mode, repoRoot, "")
  const localEnv = loadEnv(mode, process.cwd(), "")
  const apiKey = rootEnv.API_KEY || localEnv.API_KEY || process.env.API_KEY || ""

  return {
    plugins: [react()],
    css: {
      postcss: {},
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
          headers: apiKey ? { "X-API-Key": apiKey } : {},
        },
      },
    },
  }
})
