import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "pg", "@prisma/adapter-pg"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
