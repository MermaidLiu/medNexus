import type { GenomicsCase, GenomicsInterpretation } from "./genomics-types";

export async function interpretGenomicsWithLlm(
  caseData: GenomicsCase
): Promise<GenomicsInterpretation> {
  const res = await fetch("/api/v1/genomics/interpret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(caseData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `解读失败 (${res.status})`);
  }

  return res.json() as Promise<GenomicsInterpretation>;
}
