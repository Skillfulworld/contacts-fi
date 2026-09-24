"use client";

import { ReactNode } from 'react';
import { PageBrandPanel } from '@/components/ui';

interface PageLayoutProps {
  children: ReactNode;
  /** 'left' = brand panel left, app right. 'right' = app left, brand panel right. */
  brandSide: 'left' | 'right';
  swapMode?: 'swap' | 'bridge';
}

/**
 * Two-column desktop layout wrapper.
 * - Desktop (lg+): side-by-side columns filling the viewport height.
 *   Brand panel occupies unused space; app column is fixed-width max-w-md.
 * - Mobile: single column, children first, brand panel below.
 */
export default function PageLayout({ children, brandSide, swapMode }: PageLayoutProps) {
  const appCol = (
    <div className="w-full lg:w-[480px] lg:shrink-0 flex flex-col lg:h-[calc(100dvh-65px)] lg:overflow-y-auto pb-24 lg:pb-0">
      {children}
    </div>
  );

  const brandCol = (
    <div className="lg:flex-1 hidden lg:flex flex-col min-h-[calc(100dvh-65px)]">
      <PageBrandPanel swapMode={swapMode} />
    </div>
  );

  return (
    <>
      {/* Desktop two-column */}
      <div className="hidden lg:flex h-[calc(100dvh-65px)]">
        {brandSide === 'left' ? (
          <>{brandCol}{appCol}</>
        ) : (
          <>{appCol}{brandCol}</>
        )}
      </div>

      {/* Mobile single column */}
      <div className="lg:hidden">
        {children}
        {/* Brand text below the functional area on mobile */}
        <div className="px-6 pb-32 pt-10 border-t border-[#E5E7EB] mt-4">
          <PageBrandPanel swapMode={swapMode} />
        </div>
      </div>
    </>
  );
}
