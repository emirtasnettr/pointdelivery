import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    default: "Point Delivery - Çalışan Yönetim Sistemi",
    template: "%s • Point Delivery",
  },
  description:
    "Point Delivery çalışan yönetim sistemi; kurye başvuruları, evrak süreçleri ve rol bazlı paneller ile operasyonlarınızı tek yerden yönetin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${montserrat.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
