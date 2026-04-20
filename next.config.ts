import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "@prisma/client",
    "bcryptjs",
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
