import type { DiagnosisStepId, DiagnosisVisit } from "./diagnosis-types";

export async function createDiagnosisVisit(): Promise<DiagnosisVisit> {
  const res = await fetch("/api/v1/diagnosis/visits", { method: "POST" });
  if (!res.ok) throw new Error("创建就诊记录失败");
  return res.json() as Promise<DiagnosisVisit>;
}

export async function fetchDiagnosisVisit(id: string): Promise<DiagnosisVisit> {
  const res = await fetch(`/api/v1/diagnosis/visits/${id}`);
  if (!res.ok) throw new Error("加载就诊记录失败");
  return res.json() as Promise<DiagnosisVisit>;
}

export async function syncDiagnosisVisit(visit: DiagnosisVisit): Promise<DiagnosisVisit> {
  const res = await fetch(`/api/v1/diagnosis/visits/${visit.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(visit),
  });
  if (!res.ok) throw new Error("同步失败");
  return res.json() as Promise<DiagnosisVisit>;
}

export async function patchDiagnosisVisit(
  id: string,
  patch: Partial<DiagnosisVisit>
): Promise<DiagnosisVisit> {
  const res = await fetch(`/api/v1/diagnosis/visits/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("保存失败");
  return res.json() as Promise<DiagnosisVisit>;
}

export async function runAiDiagnosis(id: string): Promise<{
  visit: DiagnosisVisit;
  aiDiagnosis: DiagnosisVisit["aiDiagnosis"];
}> {
  const res = await fetch(`/api/v1/diagnosis/visits/${id}/ai-diagnose`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "AI 诊断失败");
  }
  return res.json();
}

export function isImagingZip(file: File): boolean {
  return file.name.toLowerCase().endsWith(".zip");
}

export function isImagingImage(file: File): boolean {
  return /\.(jpe?g|png)$/i.test(file.name);
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export async function uploadVisitImaging(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ pciScore?: number; sessionId?: string; ctCount?: number; summary?: string }> {
  const { uploadImagingZipForAnalysis } = await import("./imaging-api");
  const result = await uploadImagingZipForAnalysis(file, (p) => onProgress?.(Math.min(95, p.elapsedSec)));
  return {
    pciScore: result.totalPciScore,
    sessionId: result.studyId,
    ctCount: result.dicomCount,
    summary: result.diagnosis ?? (result.totalPciScore != null ? `PCI ${result.totalPciScore}` : "分析完成"),
  };
}

export function stepIndex(step: DiagnosisStepId): number {
  const order: DiagnosisStepId[] = [
    "registration",
    "preconsult",
    "labs",
    "imaging",
    "guidelines",
    "ai_diagnosis",
  ];
  return order.indexOf(step);
}

export function nextStep(step: DiagnosisStepId): DiagnosisStepId | null {
  const order: DiagnosisStepId[] = [
    "registration",
    "preconsult",
    "labs",
    "imaging",
    "guidelines",
    "ai_diagnosis",
  ];
  const i = order.indexOf(step);
  return i < order.length - 1 ? order[i + 1] : null;
}

export function prevStep(step: DiagnosisStepId): DiagnosisStepId | null {
  const order: DiagnosisStepId[] = [
    "registration",
    "preconsult",
    "labs",
    "imaging",
    "guidelines",
    "ai_diagnosis",
  ];
  const i = order.indexOf(step);
  return i > 0 ? order[i - 1] : null;
}
