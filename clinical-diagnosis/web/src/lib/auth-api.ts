import type { Doctor, Patient } from "./auth-types";
import { AUTH_TOKEN_KEY } from "./auth-types";

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(res: Response): Promise<string> {
  const err = await res.json().catch(() => ({}));
  return (err as { detail?: string }).detail ?? "请求失败";
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function registerDoctor(body: {
  email: string;
  password: string;
  name: string;
  department: string;
  title?: string;
}): Promise<{ doctor: Doctor; token: string }> {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function loginDoctor(body: {
  email: string;
  password: string;
}): Promise<{ doctor: Doctor; token: string }> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function logoutDoctor(): Promise<void> {
  await fetch("/api/v1/auth/logout", {
    method: "POST",
    headers: authHeaders(),
  }).catch(() => {});
  setStoredToken(null);
}

export async function fetchCurrentDoctor(): Promise<Doctor | null> {
  const token = getStoredToken();
  if (!token) return null;
  const res = await fetch("/api/v1/auth/me", { headers: authHeaders() });
  if (!res.ok) {
    setStoredToken(null);
    return null;
  }
  const data = (await res.json()) as { doctor: Doctor };
  return data.doctor;
}

export async function updateDoctorProfile(patch: {
  department?: string;
  title?: string;
}): Promise<Doctor> {
  const res = await fetch("/api/v1/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { doctor: Doctor };
  return data.doctor;
}

export async function fetchMyPatients(): Promise<Patient[]> {
  const res = await fetch("/api/v1/doctors/me/patients", { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { patients: Patient[] };
  return data.patients;
}

export async function createPatient(body: {
  name: string;
  gender?: string;
  age?: number;
  phone?: string;
  department?: string;
  notes?: string;
}): Promise<Patient> {
  const res = await fetch("/api/v1/doctors/me/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function bindVisitToPatient(patientId: string, visitId: string): Promise<Patient> {
  const res = await fetch(`/api/v1/doctors/me/patients/${patientId}/bind-visit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ visitId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export { authHeaders };
