"use client";

import { useCallback, useRef } from "react";
import { DiagnosisSidebar } from "@/components/layout/DiagnosisSidebar";
import { DiagnosisTopBar } from "@/components/layout/DiagnosisTopBar";
import { DoctorAuthModal } from "@/components/diagnosis/DoctorAuthModal";
import { ClinicalDiagnosisView } from "@/components/views/ClinicalDiagnosisView";
import { GuidelinesPanel } from "@/components/panels/GuidelinesPanel";
import { LiteraturePanel } from "@/components/panels/LiteraturePanel";
import { MdtPanel } from "@/components/panels/MdtPanel";
import { MyDiagnosesPanel } from "@/components/panels/MyDiagnosesPanel";
import { NactPanel } from "@/components/panels/NactPanel";
import { PatientsPanel } from "@/components/panels/PatientsPanel";
import { ResearchPanel } from "@/components/panels/ResearchPanel";
import { DiagnosisProvider, useDiagnosis } from "@/context/DiagnosisContext";

function PanelAccessDenied({ panel }: { panel: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-medium text-slate-700">当前 Agent 版本无权访问「{panel}」</p>
      <p className="max-w-sm text-xs text-slate-500">请切换至对应版本，或联系管理员开通授权。</p>
    </div>
  );
}

function DiagnosisMain() {
  const { activePanel, canAccessPanel } = useDiagnosis();
  const newVisitRef = useRef<() => void>(() => {});

  const registerNewVisit = useCallback((fn: () => void) => {
    newVisitRef.current = fn;
  }, []);

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <DiagnosisTopBar />
      <div className="flex min-h-0 flex-1">
        <DiagnosisSidebar onNewVisit={() => newVisitRef.current()} />
        <div className="flex min-w-0 flex-1 flex-col">
          {activePanel === "workflow" &&
            (canAccessPanel("workflow") ? (
              <ClinicalDiagnosisView onRegisterNewVisit={registerNewVisit} />
            ) : (
              <PanelAccessDenied panel="AI 辅助诊断" />
            ))}
          {activePanel === "patients" &&
            (canAccessPanel("patients") ? <PatientsPanel /> : <PanelAccessDenied panel="我的患者" />)}
          {activePanel === "diagnoses" &&
            (canAccessPanel("diagnoses") ? <MyDiagnosesPanel /> : <PanelAccessDenied panel="我的诊断" />)}
          {activePanel === "literature" &&
            (canAccessPanel("literature") ? <LiteraturePanel /> : <PanelAccessDenied panel="文献收录" />)}
          {activePanel === "guidelines" &&
            (canAccessPanel("guidelines") ? <GuidelinesPanel /> : <PanelAccessDenied panel="指南与证据" />)}
          {activePanel === "nact" &&
            (canAccessPanel("nact") ? <NactPanel /> : <PanelAccessDenied panel="NACT 与分期" />)}
          {activePanel === "research" &&
            (canAccessPanel("research") ? <ResearchPanel /> : <PanelAccessDenied panel="科研队列" />)}
          {activePanel === "mdt" &&
            (canAccessPanel("mdt") ? <MdtPanel /> : <PanelAccessDenied panel="MDT 病例讨论" />)}
        </div>
      </div>
    </div>
  );
}

export function DiagnosisShell() {
  return (
    <DiagnosisProvider>
      <DiagnosisMain />
      <DoctorAuthModal />
    </DiagnosisProvider>
  );
}
