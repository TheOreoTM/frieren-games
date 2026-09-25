import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://frieren.oreotm.xyz"),
  title: {
    default: "Frieren Games",
    template: "%s",
  },
  applicationName: "Frieren Games",
  description: "Play FrierenGuessr: identify Frieren anime episodes from carefully curated still frames.",
  openGraph: {
    type: "website",
    siteName: "Frieren Games",
    title: "Frieren Games",
    description: "A calm fan-made hub for FrierenGuessr and quiet competition.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Frieren Games",
    description: "A calm fan-made hub for FrierenGuessr and quiet competition.",
  },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<div className="h-16 border-b border-border bg-background" aria-hidden="true" />}>
          <SiteHeader />
        </Suspense>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
