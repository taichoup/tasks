import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    env: {
      VITE_API_URL: "http://localhost/api/tasks",
    },
  },
});
