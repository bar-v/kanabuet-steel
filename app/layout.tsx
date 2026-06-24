import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UIProvider } from "@/contexts/UIContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#F97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Kanabuet Steel",
    template: "%s | Kanabuet Steel"
  },
  description:
    "Sistem informasi manajemen proyek bengkel las konstruksi untuk memantau progres pekerjaan, lokasi proyek, material, serta dokumentasi proyek secara terpusat.",
  keywords: [
    "manajemen proyek",
    "bengkel las",
    "konstruksi baja",
    "project management",
    "kanabuet steel"
  ],
  authors: [{ name: "Kanabuet Steel" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <UIProvider>
          {children}
        </UIProvider>
      </body>
    </html>
  );
}
