import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    env: {
      DATABASE_URL: "postgresql://test:test@localhost/test",
      NEXT_PUBLIC_APP_URL: "https://app.test",
      AUTH_SECRET: "test-secret-at-least-32-chars-long!!",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
