"use client";

import { AppProvider } from "@/context/AppContext";
import { ResearchProvider } from "@/context/ResearchContext";
import { AppShell } from "@/components/layout/AppShell";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <ResearchProvider>
        <AppShell>{children}</AppShell>
      </ResearchProvider>
    </AppProvider>
  );
}
