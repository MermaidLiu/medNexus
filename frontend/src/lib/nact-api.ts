import type { NactCase, NactPrediction } from "./nact-types";

export interface NactPredictResponse extends NactPrediction {
  warning?: string;
}

export async function predictNactWithLlm(caseData: NactCase): Promise<NactPredictResponse> {
  const res = await fetch("/api/v1/nact/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(caseData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `预测失败 (${res.status})`);
  }

  return res.json() as Promise<NactPredictResponse>;
}
