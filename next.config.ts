import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/toolkit",
  output: "export",
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default nextConfig;
