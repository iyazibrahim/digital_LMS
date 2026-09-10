import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["mongoose", "bcryptjs", "adm-zip"],
};

export default nextConfig;
