import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig(({ mode }) => {
  // Load env from current directory or parent directory
  const env = loadEnv(mode, process.cwd(), "")
  const apiKey = env.VITE_API_KEY || env.API_KEY || ""

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
