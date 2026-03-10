"use client";

import { PortfolioProvider } from "@/contexts/PortfolioContext";
import AppNav from "@/components/AppNav";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <PortfolioProvider>
        {/* Persistent nav — sidebar on desktop, top bar + bottom tabs on mobile */}
        <AppNav />

        {/*
          Main content area:
          - lg:pl-56   → clear desktop sidebar (w-56)
          - pt-14      → clear mobile top bar (h-14)
          - lg:pt-0    → no top offset needed on desktop
          - pb-20      → clear mobile bottom tabs (h-20)
          - lg:pb-0    → no bottom offset needed on desktop
        */}
        <main className="lg:pl-56 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
          {children}
        </main>
      </PortfolioProvider>
    </ErrorBoundary>
  );
}
