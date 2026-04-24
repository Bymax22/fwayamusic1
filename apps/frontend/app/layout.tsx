import "./globals.css";
import LayoutClient from "./components/LayoutClient";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PaymentProvider } from "./context/PaymentContext";
import { GlobalPlayerProvider } from "./hooks/useAudioPlayer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fwaya Music",
  description: "Stream, sell, and discover music worldwide",
  icons: {
    icon: [
      {
        url: "https://res.cloudinary.com/dayn5vifn/image/upload/v1777067980/fwaya-01_eeob6c.png",
        sizes: "any",
      },
    ],
    apple: [
      {
        url: "https://res.cloudinary.com/dayn5vifn/image/upload/v1777067980/fwaya-01_eeob6c.png",
        sizes: "180x180",
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