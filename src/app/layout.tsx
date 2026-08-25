import type { Metadata, Viewport } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "MarkQ — Turn Markdown files into quizzes",
    template: "%s · MarkQ",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "Markdown to quiz",
    "Markdown quiz generator",
    "Obsidian quiz",
    "self-hosted quiz app",
    "Next.js quiz app",
    "SQLite quiz",
    "shadcn/ui",
  ],
  authors: [{ name: "MarkQ contributors", url: "https://github.com/huanngdev/markq" }],
  creator: "MarkQ contributors",
  publisher: siteName,
  alternates: { canonical: "/" },
  category: "education",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName,
    title: "MarkQ — Turn Markdown files into quizzes",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "MarkQ — Turn Markdown files into quizzes",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("h-full antialiased", "font-sans", geist.variable)}>
      <body className="min-h-full">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
