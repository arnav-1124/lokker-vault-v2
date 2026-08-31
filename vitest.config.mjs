import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  /* Vitest 4 transforms JSX/TSX via oxc (no plugin needed).
     @vitejs/plugin-react is intentionally NOT installed: its Babel 8 peer
     conflicts with the Babel 7 tree pulled in by the shadcn CSS package,
     and Fast Refresh/Babel transforms add nothing to test runs. */
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
