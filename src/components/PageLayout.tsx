"use client";

import { ReactNode } from 'react';
import { PageBrandPanel } from '@/components/ui';

interface PageLayoutProps {
  children: ReactNode;
  /** 'left' = brand panel left, app right. 'right' = app left, brand panel right. */
  brandSide?: 'left' | 'right';
  swapMode?: 'swap' | 'bridge';
  /** fullWidth: no brand panel — page uses the full viewport (e.g. Points dashboard) */
  fullWidth?: boolean;
  /** Override the brand column with custom content (desktop only) */
  brandContent?: ReactNode;
}

/**
 * Two-column desktop layout wrapper.
 * - Desktop (lg+): side-by-side columns filling the viewport height.
 *   Brand panel occupies unused space; app column is fixed-width.
 * - Mobile: single column, children first, brand panel below.
 * - fullWidth: no brand panel, page uses full viewport width.
 */
export default function PageLayout({ children, brandSide = 'left', swapMode, fullWidth, brandContent }: PageLayoutProps) {
  if (fullWidth) {
    return (
      <>
        {/* Desktop full-width */}
        <div className="hidden lg:flex h-[calc(100dvh-65px)] overflow-y-auto">
          {children}
        </div>
        {/* Mobile */}
        <div className="lg:hidden">{children}</div>
      </>
    );
  }

  const appCol = (
    <div className="w-full lg:w-[480px] lg:shrink-0 flex flex-col lg:h-[calc(100dvh-65px)] lg:overflow-y-auto pb-28 lg:pb-0">
      {children}
    </div>
  );

  const brandCol = (
    <div className="lg:flex-1 hidden lg:flex flex-col min-h-[calc(100dvh-65px)]">
      {brandContent ?? <PageBrandPanel swapMode={swapMode} />}
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
        {/* Brand text below — matches page bg; orbs create soft ambient color */}
        <div className="h-64 w-full">
          <PageBrandPanel swapMode={swapMode} />
        </div>
      </div>
    </>
  );
}
