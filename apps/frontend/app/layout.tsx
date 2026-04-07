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
    icon: "/Fwaya Innovations icon 1-01.png",
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




