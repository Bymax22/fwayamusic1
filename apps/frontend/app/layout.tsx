import "./globals.css";
import LayoutClient from "./components/LayoutClient";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PaymentProvider } from "./context/PaymentContext";
import { GlobalPlayerProvider } from "./hooks/useAudioPlayer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fwaya",
  description: "Stream, sell, and discover music worldwide",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        type: "image/x-icon",
        sizes: "16x16 32x32 48x48 64x64 128x128 256x256",
      },
      {
        url: "/fwaya-lp-01.png",
        sizes: "any",
      },
    ],
    apple: [
      {
        url: "/fwaya-lp-01.png",
        sizes: "180x180",
      },
    ],
    shortcut: [
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <PaymentProvider>
              <GlobalPlayerProvider>
                <LayoutClient>{children}</LayoutClient>
              </GlobalPlayerProvider>
            </PaymentProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}