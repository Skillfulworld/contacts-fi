import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacts-Fi",
  description: "Crypto contacts for Arc",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}