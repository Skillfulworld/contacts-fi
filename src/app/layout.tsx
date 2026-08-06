import type { Metadata } from "next";
import "./globals.css";
import RootLayoutContent from "./RootLayoutContent";

export const metadata: Metadata = {
  title: "Contacts-Fi",
  description: "Crypto contacts for the Arc Network",
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
