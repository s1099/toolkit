import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/toolkit",
  images: { unoptimized: true },
  output: "export",
  reactCompiler: true,
};

export default nextConfig;
