import type { Metadata } from "next";
import "./globals.css";
import RootLayoutContent from "./RootLayoutContent";

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
    <html lang="en">
      <body className="antialiased selection:bg-[var(--md-sys-color-primary-container)]">
        <RootLayoutContent>{children}</RootLayoutContent>
      </body>
    </html>
  );
}
