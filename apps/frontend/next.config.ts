
import { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Proxy API requests to NestJS backend in development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/:path*",
      },
    ];
  },

  // Allow external images from Cloudinary
  images: {
    domains: ["res.cloudinary.com"],
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
              script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.google.com https://media-library.cloudinary.com https://console.cloudinary.com blob:;
              script-src-elem 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.google.com https://media-library.cloudinary.com https://console.cloudinary.com blob:;
              connect-src 'self' http://localhost:3001 https://api.cloudinary.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://apis.google.com https://www.googleapis.com https://graph.facebook.com https://www.google.com;
              img-src 'self' https://res.cloudinary.com data: blob:;
              media-src 'self' https://res.cloudinary.com blob:;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com data:;
              frame-src 'self' https://www.google.com https://www.facebook.com;
            `.replace(/\s+/g, " ").trim(),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },

  // Keep existing outputFileTracingRoot
  outputFileTracingRoot: path.resolve(__dirname, "../../"),
};

export default nextConfig;
