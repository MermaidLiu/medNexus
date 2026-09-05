"use client";

import { Suspense } from "react";
import { NactOvarianView } from "@/components/views/NactOvarianView";

export default function NactOvarianPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">加载中…</div>}>
      <NactOvarianView />
    </Suspense>
  );
}
