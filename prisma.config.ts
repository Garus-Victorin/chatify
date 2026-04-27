/**
 * Prisma 7 config — chargé via jiti (CommonJS synchrone).
 *
 * IMPORTANT: `import "dotenv/config"` ne fonctionne PAS ici car Prisma
 * charge ce fichier via c12/jiti avec `dotenv: false`.
 * On utilise require() synchrone à la place.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require("dotenv");
dotenv.config();

import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "\n\n❌ DATABASE_URL is not set.\n" +
    "Create a .env file at the project root with:\n\n" +
    '  DATABASE_URL="postgresql://user:password@host:5432/chatify"\n\n' +
    "See .env.example for all required variables.\n"
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
