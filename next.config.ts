import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  // Mematikan pesan error/warning Next.js terkait Webpack custom plugin (Serwist) vs Turbopack saat `npm run dev`
  turbopack: {},
  images: {
    qualities: [75, 90],
  },
};

export default withSerwist(nextConfig);
