/** 临床诊断流程 — Web 与小程序共享数据结构 */

export type DiagnosisStepId =
  | "registration"
  | "preconsult"
  | "labs"
  | "imaging"
  | "guidelines"
  | "ai_diagnosis";

export interface DiagnosisVisit {
  id: string;
  createdAt: string;
  updatedAt: string;
  currentStep: DiagnosisStepId;
  completedSteps: DiagnosisStepId[];
  registration: {
    patientName: string;
    age?: number;
    gender: string;
    phone?: string;
    department: string;
    visitNo?: string;
    chiefComplaint: string;
  };
  preconsult: {
    symptoms: string;
    duration?: string;
    history: string;
    allergies?: string;
    medications?: string;
    chatMessages?: { role: "user" | "assistant"; content: string }[];
  };
  labs: {
    blood: Record<string, string>;
    urine: Record<string, string>;
    notes?: string;
  };
  imaging: {
    uploaded: boolean;
    fileName?: string;
    fileType?: "zip" | "image";
    pciScore?: number;
    sessionId?: string;
    summary?: string;
    ctCount?: number;
    images?: { name: string; dataUrl?: string }[];
  };
  guidelines: {
    selected: string[];
    notes?: string;
  };
  aiDiagnosis?: {
    summary: string;
    differential: string[];
    recommendations: string[];
    urgency: string;
    guidelineRefs?: string[];
    reasoning?: string;
    source?: string;
    model?: string;
  };
}

export const DIAGNOSIS_STEPS: { id: DiagnosisStepId; label: string; desc: string }[] = [
  { id: "registration", label: "挂号", desc: "基本信息与主诉" },
  { id: "preconsult", label: "预问诊", desc: "症状与病史" },
  { id: "labs", label: "生化分析", desc: "验血 / 验尿" },
  { id: "imaging", label: "影像上传", desc: "DICOM 压缩包或 JPG/PNG 影像" },
  { id: "guidelines", label: "参考指南", desc: "NCCN / ESMO" },
  { id: "ai_diagnosis", label: "AI 辅助诊断", desc: "综合决策建议" },
];

export const GUIDELINE_OPTIONS = [
  "NCCN 卵巢癌诊疗指南",
  "NCCN 宫颈癌诊疗指南",
  "NCCN 子宫内膜癌指南",
  "ESMO 妇科肿瘤临床实践",
  "FIGO 分期与手术规范",
  "中国妇科肿瘤临床诊疗指南",
];

export const DEFAULT_BLOOD_FIELDS = ["CA125", "HE4", "WBC", "Hb", "PLT", "CRP", "ALT", "Cr"];
export const DEFAULT_URINE_FIELDS = ["尿蛋白", "尿糖", "尿潜血", "尿比重"];

export const DIAGNOSIS_VISIT_KEY = "mednexus_diagnosis_visit_id";

export function createEmptyVisit(id: string): DiagnosisVisit {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    currentStep: "registration",
    completedSteps: [],
    registration: {
      patientName: "",
      gender: "女",
      department: "妇科肿瘤",
      chiefComplaint: "",
    },
    preconsult: { symptoms: "", history: "" },
    labs: { blood: {}, urine: {}, notes: "" },
    imaging: { uploaded: false },
    guidelines: { selected: [], notes: "" },
  };
}
