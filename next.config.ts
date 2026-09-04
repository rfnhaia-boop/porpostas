import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que o Next suba a árvore e pegue o package-lock.json de C:\Users\rafael
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
