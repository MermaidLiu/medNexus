"use client";

import { AppProvider } from "@/context/AppContext";
import { AppShell } from "@/components/layout/AppShell";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
