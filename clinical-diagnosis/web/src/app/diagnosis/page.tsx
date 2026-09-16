"use client";

import { Suspense } from "react";
import { DiagnosisShell } from "@/components/layout/DiagnosisShell";

export default function DiagnosisPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-slate-400">加载中…</div>}>
      <DiagnosisShell />
    </Suspense>
  );
}
