import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Makes Open Graph image/page URLs absolute, so WhatsApp link previews resolve.
  metadataBase: new URL(process.env.PUBLIC_BASE_URL || "http://localhost:3000"),
  title: "CashewTrace",
  applicationName: "CashewTrace",
  appleWebApp: { title: "CashewTrace", capable: true, statusBarStyle: "default" },
  description:
    "Village quality hubs for Nigerian cashew: dried, tested, graded and QR-traced raw cashew nut lots.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1F5130",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <PrototypeBanner />
        {children}
      </body>
    </html>
  );
}
