import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the bottom-left on-screen indicator (the "N" route-status badge).
  // It's a dev-tools affordance, not part of WhiteClaw's UI; runtime + build
  // errors still surface in the console.
  devIndicators: false,
};

export default nextConfig;
