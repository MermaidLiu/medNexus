"use client";

import { Suspense } from "react";
import { GenomicsMultiSourceView } from "@/components/views/GenomicsMultiSourceView";

export default function GenomicsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">加载中…</div>}>
      <GenomicsMultiSourceView />
    </Suspense>
  );
}
