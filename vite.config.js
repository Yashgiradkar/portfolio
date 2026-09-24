import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("three") ||
              id.includes("@react-three") ||
              id.includes("three-stdlib") ||
              id.includes("maath")
            ) {
              return "three-vendor";
            }
            if (id.includes("framer-motion")) {
              return "framer-motion-vendor";
            }
            if (id.includes("react-vertical-timeline-component")) {
              return "timeline-vendor";
            }
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
              return "react-vendor";
            }
          }
        },
      },
    },
  },
  commonjsOptions: {
    esmExternals: true,
  },
});