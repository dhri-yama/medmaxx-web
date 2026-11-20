import type { NextConfig } from "next";

// Static export: builds plain HTML/CSS/JS into `out/` so it can be hosted on GitHub Pages.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
