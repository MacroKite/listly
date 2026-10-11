import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["400", "500"] });
const bengali = Noto_Sans_Bengali({ variable: "--font-bengali", subsets: ["bengali"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Listly — Things people make, ready to download", template: "%s · Listly" },
  description: "Templates, ebooks, presets, fonts and courses from independent creators.",
  openGraph: { siteName: "Listly", type: "website" },
};

export const viewport: Viewport = { themeColor: "#FAFAFB" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} ${bengali.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
