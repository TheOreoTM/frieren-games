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
    default: "Magic in Passing",
    template: "%s",
  },
  applicationName: "Magic in Passing",
  description: "Small games from a long journey. Play FrierenGuessr and test which moments stayed with you.",
  openGraph: {
    type: "website",
    siteName: "Magic in Passing",
    title: "Magic in Passing",
    description: "A calm, unofficial Frieren fan-game collection.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Magic in Passing",
    description: "Small games from a long journey.",
  },
  icons: { icon: "/icon.png" },
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
