import LayoutClient from "./components/LayoutClient";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PaymentProvider } from "./context/PaymentContext";
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
    <ThemeProvider>
      <AuthProvider>
        <PaymentProvider>
          <LayoutClient>
            {children}
          </LayoutClient>
        </PaymentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}