import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeRegistry } from "@/components/theme-registry";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TDMSMANAGMENT", template: "%s · TDMSMANAGMENT" },
  description: "محصولات، موجودی، شرکت‌ها و فضای کاری شما در یک سامانه یکپارچه.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <ThemeRegistry>
          {children}
          <Toaster
            dir="rtl"
            position="bottom-left"
            richColors
            closeButton
            containerAriaLabel="اعلان‌ها"
            toastOptions={{ closeButtonAriaLabel: "بستن اعلان" }}
          />
        </ThemeRegistry>
      </body>
    </html>
  );
}
