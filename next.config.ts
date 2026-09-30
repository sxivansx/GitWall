import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["canvas"],
  // Let phones on the local network load the dev server's assets when testing
  // the Android flow against `npm run dev`. Not used by production builds.
  allowedDevOrigins: ["192.168.1.41", "192.168.1.*"],
};

export default nextConfig;
