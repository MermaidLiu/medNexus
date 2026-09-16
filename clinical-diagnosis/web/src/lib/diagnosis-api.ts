import type { DiagnosisStepId, DiagnosisVisit } from "./diagnosis-types";
import { authHeaders } from "./auth-api";

export async function createDiagnosisVisit(opts?: {
  patientId?: string;
  department?: string;
}): Promise<DiagnosisVisit> {
  const res = await fetch("/api/v1/diagnosis/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(opts ?? {}),
  });
  if (!res.ok) throw new Error("创建就诊记录失败");
  return res.json() as Promise<DiagnosisVisit>;
}

export async function fetchDiagnosisVisit(id: string): Promise<DiagnosisVisit> {
  const res = await fetch(`/api/v1/diagnosis/visits/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("加载就诊记录失败");
  return res.json() as Promise<DiagnosisVisit>;
}

export async function patchDiagnosisVisit(
  id: string,
  patch: Partial<DiagnosisVisit>
): Promise<DiagnosisVisit> {
  const res = await fetch(`/api/v1/diagnosis/visits/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("保存失败");
  return res.json() as Promise<DiagnosisVisit>;
}

export async function runAiDiagnosis(id: string): Promise<{
  visit: DiagnosisVisit;
  aiDiagnosis: DiagnosisVisit["aiDiagnosis"];
}> {
  const res = await fetch(`/api/v1/diagnosis/visits/${id}/ai-diagnose`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "AI 诊断失败");
  }
  return res.json();
}

export async function fetchMyVisits(): Promise<DiagnosisVisit[]> {
  const res = await fetch("/api/v1/diagnosis/visits", { headers: authHeaders() });
  if (!res.ok) throw new Error("加载诊断记录失败");
  const data = (await res.json()) as { visits: DiagnosisVisit[] };
  return data.visits;
}

export function isImagingZip(file: File): boolean {
  return file.name.toLowerCase().endsWith(".zip");
}

export function isImagingDicom(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".dcm") || name.endsWith(".dicom");
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

/** 上传 DICOM ZIP / .dcm → CT 分割 + PCI 评分 */
export async function uploadVisitImaging(
  file: File,
  onProgress?: (message: string) => void
): Promise<{
  pciScore?: number;
  sessionId?: string;
  ctCount?: number;
  summary?: string;
  fileName?: string;
}> {
  const { uploadImagingZipForAnalysis } = await import("./imaging-api");
  const result = await uploadImagingZipForAnalysis(file, (p) => onProgress?.(p.message));
  return {
    fileName: file.name,
    pciScore: result.totalPciScore,
    sessionId: result.studyId,
    ctCount: result.dicomCount,
    summary:
      result.diagnosis ??
      (result.totalPciScore != null
        ? `PCI ${result.totalPciScore} · ${result.dicomCount ?? 0} 张 CT`
        : "CT 分析完成"),
  };
}

const PATIENT_STEP_ORDER: DiagnosisStepId[] = [
  "registration",
  "preconsult",
  "labs",
  "imaging",
  "guidelines",
  "ai_diagnosis",
];

export const DOCTOR_STEP_ORDER: DiagnosisStepId[] = [
  "structured_record",
  "labs",
  "imaging",
  "guidelines",
  "ai_diagnosis",
];

/** 医生端：将患者端步骤映射为医生可见步骤 */
export function normalizeDoctorStep(step: DiagnosisStepId): DiagnosisStepId {
  if (step === "registration" || step === "preconsult") return "structured_record";
  if (DOCTOR_STEP_ORDER.includes(step)) return step;
  return "structured_record";
}

export function doctorNextStep(step: DiagnosisStepId): DiagnosisStepId | null {
  const normalized = normalizeDoctorStep(step);
  const i = DOCTOR_STEP_ORDER.indexOf(normalized);
  return i < DOCTOR_STEP_ORDER.length - 1 ? DOCTOR_STEP_ORDER[i + 1] : null;
}

export function doctorPrevStep(step: DiagnosisStepId): DiagnosisStepId | null {
  const normalized = normalizeDoctorStep(step);
  const i = DOCTOR_STEP_ORDER.indexOf(normalized);
  return i > 0 ? DOCTOR_STEP_ORDER[i - 1] : null;
}

export function isDoctorStepDone(visit: DiagnosisVisit, stepId: DiagnosisStepId): boolean {
  if (visit.completedSteps.includes(stepId)) return true;
  if (stepId === "structured_record") {
    const r = visit.registration;
    const p = visit.preconsult;
    return (
      visit.completedSteps.includes("preconsult") ||
      Boolean(r.patientName || r.chiefComplaint || p.symptoms || p.history || (p.chatMessages?.length ?? 0) > 0)
    );
  }
  return false;
}

export function nextStep(step: DiagnosisStepId): DiagnosisStepId | null {
  const i = PATIENT_STEP_ORDER.indexOf(step);
  return i < PATIENT_STEP_ORDER.length - 1 ? PATIENT_STEP_ORDER[i + 1] : null;
}

export function prevStep(step: DiagnosisStepId): DiagnosisStepId | null {
  const i = PATIENT_STEP_ORDER.indexOf(step);
  return i > 0 ? PATIENT_STEP_ORDER[i - 1] : null;
}
