import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });

export const metadata: Metadata = {
  title: { default: "Study Tracker", template: "%s · Study Tracker" },
  description: "Log study sessions, track hours, and see your progress.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} font-sans`}>
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
