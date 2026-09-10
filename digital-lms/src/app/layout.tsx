import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { MarketingChrome } from "@/components/layout/marketing-chrome";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital Penang LMS",
  description:
    "Digital Penang learning platform — courses, live batches, quizzes, certificates, and careers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <MarketingChrome header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </MarketingChrome>
      </body>
    </html>
  );
}
