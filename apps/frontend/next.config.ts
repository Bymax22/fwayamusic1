
import { NextConfig } from "next";
import path from "path";

// Use environment variable to point to backend in production (set NEXT_PUBLIC_API_URL in Vercel)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Allow external images from Cloudinary
  images: {
    domains: ["res.cloudinary.com"],
  },

  // Server external packages (moved from experimental in Next.js 15)
  serverExternalPackages: [],

  // Configure API body size limit
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'inline-speculation-rules' https://apis.google.com https://www.gstatic.com https://www.google.com https://cdn.jsdelivr.net https://media-library.cloudinary.com https://console.cloudinary.com https://infird.com https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://recaptcha.net blob:;
              script-src-elem 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.google.com https://cdn.jsdelivr.net https://media-library.cloudinary.com https://console.cloudinary.com https://infird.com https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://recaptcha.net blob:;
              connect-src 'self' ${API_URL} https://api.cloudinary.com https://res.cloudinary.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://apis.google.com https://www.googleapis.com https://www.gstatic.com https://graph.facebook.com https://www.google.com https://www.google-analytics.com https://www.recaptcha.net https://recaptcha.net https://www.google.com/recaptcha/ https://vercel.live;
              img-src 'self' https://res.cloudinary.com data: blob:;
              media-src 'self' https://res.cloudinary.com blob: data:;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://recaptcha.net;
              font-src 'self' https://fonts.gstatic.com data:;
              frame-src 'self' https://www.google.com https://www.facebook.com https://www.recaptcha.net https://recaptcha.net https://vercel.live;
              child-src https://www.google.com https://www.recaptcha.net https://recaptcha.net;
            `.replace(/\s+/g, " ").trim(),
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },

  // Keep existing outputFileTracingRoot
  outputFileTracingRoot: path.resolve(__dirname, "../../"),
};

export default nextConfig;
