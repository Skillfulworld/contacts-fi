"use client";
import { usePathname } from "next/navigation";
import { BottomNavigation, DesktopTopNav, WalletHeader, BrandLogo } from "@/components/ui";
import { ContactProvider } from "@/context/ContactContext";
import { WalletProvider } from "@/context/WalletContext";

export default function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <WalletProvider>
      <ContactProvider>
        {/* Desktop top nav — hidden on mobile */}
        {!isLanding && <DesktopTopNav />}

        {isLanding ? (
          // Landing page — full width, no shell
          <main>{children}</main>
        ) : (
          // App pages — mobile: single column with header; desktop: full height, no extra header
          <main className="min-h-[calc(100dvh-65px)] bg-[var(--md-sys-color-background)]">
            {/* Mobile-only compact header (logo + wallet) */}
            <header className="lg:hidden px-4 py-3 flex items-center justify-between bg-[var(--md-sys-color-background)] border-b border-[#E5E7EB]">
              <BrandLogo />
              <WalletHeader />
            </header>

            {/* Page content — children wrap themselves in PageLayout on desktop */}
            {children}

            <BottomNavigation />
          </main>
        )}
      </ContactProvider>
    </WalletProvider>
  );
}
