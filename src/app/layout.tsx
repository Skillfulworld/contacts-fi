import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";
import RootLayoutContent from "./RootLayoutContent";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "SettleX",
  description: "Send USDC to anyone on Arc Network. Swap, bridge, and manage your crypto contacts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="antialiased selection:bg-[var(--md-sys-color-primary-container)]">
        <RootLayoutContent>{children}</RootLayoutContent>
      </body>
    </html>
  );
}
