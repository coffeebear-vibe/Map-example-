import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PDF Accessibility Guide",
  description:
    "Upload a PDF and we'll walk you through every fix, one step at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${playfair.variable} antialiased`}>
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
