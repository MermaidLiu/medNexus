"use client";

import { Suspense } from "react";
import { ResearchView } from "@/components/views/ResearchView";

export default function ResearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">加载研究项目…</div>}>
      <ResearchView />
    </Suspense>
  );
}
