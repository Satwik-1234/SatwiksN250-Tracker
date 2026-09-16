import type { NextConfig } from "next";

const isGithubPages =
  process.env.GITHUB_PAGES?.trim() === "true" ||
  process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // GitHub Pages requires static HTML export. Vercel runs full serverless Next.js with API routes.
  ...(isGithubPages && {
    output: "export",
  }),
};

export default nextConfig;
