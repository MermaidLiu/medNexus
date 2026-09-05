"use client";

import { Suspense } from "react";
import { ComputeView } from "@/components/views/ComputeView";

export default function ComputePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">加载中…</div>}>
      <ComputeView />
    </Suspense>
  );
}
