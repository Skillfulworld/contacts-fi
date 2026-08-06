import type { Metadata } from "next";
import "./globals.css";
import { BottomNavigation, WalletHeader } from "@/components/ui";
import { ContactProvider } from "@/context/ContactContext";
import { WalletProvider } from "@/context/WalletContext";

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
        <WalletProvider>
          <ContactProvider>
            <main className="max-w-md mx-auto min-h-screen pb-24 relative bg-[var(--md-sys-color-background)] shadow-2xl shadow-black/10">
              <header className="px-4 py-3 flex items-center justify-between bg-[var(--md-sys-color-background)]">
                <div />
                <WalletHeader />
              </header>
              {children}
              <BottomNavigation />
            </main>
          </ContactProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
