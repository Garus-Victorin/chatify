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

const url = process.env.DATABASE_URL ?? "postgresql://localhost:5432/chatify";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
