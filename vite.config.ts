import { compilerOptions } from "./tsconfig.json";
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
    target: compilerOptions.target,
    minify: false,
    rollupOptions: {
      preserveEntrySignatures: "exports-only",
      output: {
        esModule: true,
        manualChunks: path => {
          if (path.includes("packages")) {
            return "packages";
          } else if (path.includes("node_modules")) {
            return "vendor";
          } else {
            return "app";
          }
        },
      }
    }
  },
  server: {
    port: 8000,
    cors: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    }
  }
})