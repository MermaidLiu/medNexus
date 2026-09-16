export interface Doctor {
  id: string;
  email: string;
  name: string;
  department: string;
  title: string;
  createdAt?: string;
}

export interface Patient {
  id: string;
  doctorId: string;
  name: string;
  gender: string;
  age?: number;
  phone?: string;
  department: string;
  notes?: string;
  visitIds: string[];
  createdAt: string;
  updatedAt: string;
}

export const AUTH_TOKEN_KEY = "clinical_diagnosis_auth_token";

export const DEPARTMENTS = [
  "妇科肿瘤",
  "妇科",
  "肿瘤内科",
  "放疗科",
  "病理科",
  "影像科",
  "综合内科",
  "急诊科",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const DOCTOR_TITLES = ["住院医师", "主治医师", "副主任医师", "主任医师", "教授"] as const;
