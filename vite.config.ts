import { compilerOptions } from "./tsconfig.json";
import { defineConfig } from "vite";

const headers = new Headers();

headers.set("Cross-Origin-Opener-Policy-Only", "same-origin")
headers.set("Cross-Origin-Embedder-Policy-Only", "require-corp");
headers.set("Access-Control-Allow-Origin", "http://localhost:8000");

export default defineConfig({
  build: {
    target: compilerOptions.target,
    rollupOptions: {
      output: {
        manualChunks: path => {
          if (path.includes("node_modules")) {
            return "vendor";
          } else if (path.includes("packages")) {
            return "packages";
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
      "Cross-Origin-Opener-Policy-Only": "same-origin",
      "Cross-Origin-Embedder-Policy-Only": "require-corp",
    }
  }
})