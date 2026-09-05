"use client";

import { Suspense } from "react";
import { ProduceView } from "@/components/views/ProduceView";

export default function ProducePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">加载中…</div>}>
      <ProduceView />
    </Suspense>
  );
}
