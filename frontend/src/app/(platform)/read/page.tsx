"use client";

import { Suspense } from "react";
import { ReadView } from "@/components/views/ReadView";

export default function ReadPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">加载中…</div>}>
      <ReadView />
    </Suspense>
  );
}
