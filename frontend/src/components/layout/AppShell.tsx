"use client";

import { type ReactNode } from "react";
import { LeftNav } from "./LeftNav";
import { TopBar } from "./TopBar";
import { GlobalNewStudyModal } from "../GlobalNewStudyModal";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <LeftNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/50">
          {children}
        </main>
      </div>
      <GlobalNewStudyModal />
    </div>
  );
}
