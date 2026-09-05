"use client";

import { Suspense } from "react";
import { ImagingView } from "@/components/views/ImagingView";

export default function ImagingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">加载中…</div>}>
      <ImagingView />
    </Suspense>
  );
}
