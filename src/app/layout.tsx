import type { Metadata } from "next";
import "./globals.css";
import { BottomNavigation } from "@/components/ui";
import { ContactProvider } from "@/context/ContactContext";

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
  <ContactProvider>
    <main className="max-w-md mx-auto min-h-screen pb-24 relative bg-[var(--md-sys-color-background)] shadow-2xl shadow-black/10">
      {children}
      <BottomNavigation />
    </main>
  </ContactProvider>
</body>
    </html>
  );
}
