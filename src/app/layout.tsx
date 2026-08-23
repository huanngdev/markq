import type { Metadata, Viewport } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "MarkQ — Markdown quizzes",
    template: "%s · MarkQ",
  },
  description: "Take and review Markdown quizzes with results stored in SQLite.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full antialiased", "font-sans", geist.variable)}>
      <body className="min-h-full">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <TooltipProvider>
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
