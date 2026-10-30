import type { NextConfig } from "next";

// Host of the public domain (e.g. cashewtrace.up.railway.app). Server Actions already accept
// same-origin requests; listing the public host keeps forms working if a proxy rewrites Host.
const publicHost = (() => {
  try {
    return process.env.PUBLIC_BASE_URL ? new URL(process.env.PUBLIC_BASE_URL).host : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  // Keep the classic, fully dynamic rendering model: most pages read the DB or the session cookie.
  cacheComponents: false,
  experimental: {
    serverActions: { allowedOrigins: publicHost ? [publicHost] : [] },
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
