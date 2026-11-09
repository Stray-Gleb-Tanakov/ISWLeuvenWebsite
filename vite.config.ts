import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // members-api runs on 3001 locally (PORT=3001 npm --prefix members-api run dev)
      "/api/members": "http://localhost:3001",
      // door-api runs on 3002 locally (PORT=3002 npm --prefix door-api run dev)
      "/api/door": "http://localhost:3002",
      "/api": "http://localhost:3000",
    },
    // Same as nginx.conf in production, so the header flag also works locally
    headers: {
      "X-ISW-Flag": "ISW{H34D3R_HUNT3R}",
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
