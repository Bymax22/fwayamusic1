import LayoutClient from "./components/LayoutClient";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PaymentProvider } from "./context/PaymentContext";

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