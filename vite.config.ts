import { defineConfig } from "vite";

import wasm from "vite-plugin-wasm"

export default defineConfig({
  plugins: [ wasm() ],
  worker: {
    format: "es"
  },
  resolve: {
    alias: {
      '~': `${ import.meta.dirname }/source`,
    }
  },
  build: {
    target: "ESNext",
    minify: false,
    rollupOptions: {
      preserveEntrySignatures: "exports-only",
      output: {
        esModule: true,
        manualChunks: path => {
          if (path.includes("node_modules")) {
            return "vendor";
          } else {
            return "app";
          }
        },
      }
    }
  },
  server: {
    port: 3000,
    cors: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    }
  }
})