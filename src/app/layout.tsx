import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";
import RootLayoutContent from "./RootLayoutContent";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://settlex.vercel.app"),
  title: "Settle Exchange",
  description: "Send USDC to anyone on Arc Network. Swap, bridge, and manage your crypto contacts with Settle Exchange.",
  icons: {
    icon: [
      { url: "/branding/settlex-icon.png", type: "image/png" },
    ],
    apple: "/branding/settlex-icon.png",
    shortcut: "/branding/settlex-icon.png",
  },
  openGraph: {
    title: "Settle Exchange",
    description: "Send USDC to anyone on Arc. Swap, bridge, and manage your crypto contacts.",
    images: [{ url: "/branding/settlex-og-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Settle Exchange",
    description: "Send USDC to anyone on Arc.",
    images: ["/branding/settlex-og-1200x630.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
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
