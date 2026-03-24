// apps/player/src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

// Use system fonts instead of Google Fonts to avoid network issues during build
// Font stack: Inter, Poppins fallbacks to system fonts
const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';

export const metadata: Metadata = {
  title: 'Fwaya Music Player - Premium Audio Experience',
  description: 'High-quality music streaming with DRM protection, beautiful visualizations, and seamless playback across all devices.',
  keywords: 'music player, streaming, DRM, audio visualization, music platform',
  authors: [{ name: 'Fwaya Music' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: '#e51f48',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Fwaya Music Player',
    description: 'Premium audio experience with DRM protection',
    type: 'website',
    locale: 'en_US',
    siteName: 'Fwaya Music',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Fwaya Music Player',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fwaya Music Player',
    description: 'Premium audio experience with DRM protection',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            --font-sans: ${fontStack};
          }
          body {
            font-family: var(--font-sans);
          }
        `}</style>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-startup-image" href="/splash.png" />
      </head>
      <body className="antialiased">
        {/* Background gradient effect */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-primary rounded-full filter blur-[100px] opacity-20 animate-float" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-500 to-pink-500 rounded-full filter blur-[100px] opacity-10 animate-float animation-delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full filter blur-[120px] opacity-5 animate-spin-slow" />
        </div>

        {/* Main content */}
        <main className="relative min-h-screen">
          {children}
        </main>

        {/* Floating particles effect */}
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/10 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s infinite`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: 0.3 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      </body>
    </html>
  );
}