import path from "path";
import { defineConfig } from "prisma/config";
import { config as loadDotenv } from "dotenv";

// Load .env.local first (Next.js convention), fallback to .env
loadDotenv({ path: path.resolve(process.cwd(), ".env.local") });
loadDotenv({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
