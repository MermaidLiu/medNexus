import { Suspense } from "react";
import { OmicsHubView } from "@/components/views/OmicsHubView";

export default function OmicsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-400">加载多组学中心…</div>}>
      <OmicsHubView />
    </Suspense>
  );
}
