"use client";
import { usePathname } from "next/navigation";
import { BottomNavigation, WalletHeader, BrandLogo } from "@/components/ui";
import { ContactProvider } from "@/context/ContactContext";
import { WalletProvider } from "@/context/WalletContext";

export default function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <WalletProvider>
      <ContactProvider>
        <main className={`mx-auto min-h-screen relative bg-[var(--md-sys-color-background)] ${!isLanding ? 'max-w-md shadow-2xl shadow-black/10' : ''} pb-24`}>
          {!isLanding && (
            <header className="px-4 py-3 flex items-center justify-between bg-[var(--md-sys-color-background)]">
              <BrandLogo />
              <WalletHeader />
            </header>
          )}
          {children}
          {!isLanding && <BottomNavigation />}
        </main>
      </ContactProvider>
    </WalletProvider>
  );
}
