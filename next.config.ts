import type { NextConfig } from "next";

const PROMPTS_ORIGIN = "https://fluxora-prompt-gallery.vercel.app";
const TOOLS_ORIGIN = "https://tool-directory-ochre.vercel.app";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/prompts",
        destination: `${PROMPTS_ORIGIN}/prompts`,
      },
      {
        source: "/prompts/:path*",
        destination: `${PROMPTS_ORIGIN}/prompts/:path*`,
      },
      {
        source: "/trial",
        destination: `${TOOLS_ORIGIN}/tools/trial`,
      },
      {
        source: "/legacy",
        destination: `${TOOLS_ORIGIN}/tools/legacy`,
      },
      {
        source: "/legacy/:path*",
        destination: `${TOOLS_ORIGIN}/tools/legacy/:path*`,
      },
      {
        source: "/tools",
        destination: `${TOOLS_ORIGIN}/tools`,
      },
      {
        source: "/tools/:path*",
        destination: `${TOOLS_ORIGIN}/tools/:path*`,
      },
    ];
  },
};

export default nextConfig;
