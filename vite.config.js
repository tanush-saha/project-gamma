import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/[/\\]node_modules[/\\]three[/\\]/.test(id)) return "three";
          if (/[/\\]node_modules[/\\]@react-three[/\\]fiber[/\\]/.test(id)) return "react-three-fiber";
          if (/[/\\]node_modules[/\\]@react-three[/\\]drei[/\\]/.test(id)) return "react-three-drei";
        },
      },
    },
  },
});
