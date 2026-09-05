import type { Study, StudySummary } from "./types";
import { getApiBase } from "./api-base";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof err.detail === "string" ? err.detail : `HTTP ${res.status}`
    );
  }
  return res.json();
}

export async function listStudies(): Promise<StudySummary[]> {
  return request("/api/v1/studies");
}

export async function createStudy(topic: string): Promise<Study> {
  return request("/api/v1/studies", {
    method: "POST",
    body: JSON.stringify({ topic }),
  });
}

export async function getStudy(id: string): Promise<Study> {
  return request(`/api/v1/studies/${id}`);
}

export async function runPipeline(id: string): Promise<Study> {
  return request(`/api/v1/studies/${id}/run`, { method: "POST" });
}

export async function runStep(id: string, stepId: string): Promise<Study> {
  return request(`/api/v1/studies/${id}/steps/${stepId}/run`, { method: "POST" });
}

export async function approveStep(
  id: string,
  stepId: string,
  feedback = ""
): Promise<Study> {
  return request(`/api/v1/studies/${id}/steps/${stepId}/approve`, {
    method: "POST",
    body: JSON.stringify({ feedback }),
  });
}
