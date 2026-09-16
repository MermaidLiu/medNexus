import type { Metadata, Viewport } from "next";
import { ClinicalDiagnosisView } from "@/components/views/ClinicalDiagnosisView";

export const metadata: Metadata = {
  title: "MedNexus 临床诊断",
  description: "挂号-预问诊-检验-影像-AI诊断（小程序同步版）",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#e11d48",
};

export default function MobileDiagnosisPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <ClinicalDiagnosisView mobile />
    </div>
  );
}
