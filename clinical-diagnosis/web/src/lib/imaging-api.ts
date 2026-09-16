import type { ImagingAnalysisResult, PciRegionResult } from "./imaging-types";
import { pciFieldToLabel } from "./imaging-types";

const UPLOAD_API = "/api/imaging/upload-zip";
const CT_HEALTH_PROXY =
  process.env.NEXT_PUBLIC_IMAGING_API_URL?.replace(/\/$/, "") ?? "/imaging-api";

export type UploadProgress = {
  phase: "uploading" | "analyzing";
  message: string;
  elapsedSec: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function pickBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function toImageSrc(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("http")) return trimmed;
  return `data:image/png;base64,${trimmed}`;
}

const PCI_META_KEYS = new Set([
  "isPositive",
  "is_positive",
  "positiveRate",
  "positive_rate",
  "pciScore",
  "pci_score",
  "conclusion",
  "summary",
  "diagnosis",
]);

function normalizeCtSlice(raw: unknown, index: number) {
  const item = asRecord(raw) ?? {};
  const filename = pickString(item.filename, item.fileName, item.file_name, item.name);
  const overlay = toImageSrc(item.resultBase64 ?? item.result_base64);
  const png = toImageSrc(item.pngBase64 ?? item.png_base64);
  const maskFromApi = toImageSrc(
    item.maskBase64 ??
      item.mask_base64 ??
      item.labelBase64 ??
      item.label_base64 ??
      item.roiBase64 ??
      item.roi_base64
  );

  return {
    index,
    image: overlay ?? png,
    baseImage: png,
    maskImage: maskFromApi,
    filename,
    label: filename ?? `切片 ${index + 1}`,
  };
}

function normalizePciRegions(pci: Record<string, unknown>): PciRegionResult[] {
  const regions: PciRegionResult[] = [];

  for (const [key, value] of Object.entries(pci)) {
    if (PCI_META_KEYS.has(key)) continue;
    if (!/^pci\d/i.test(key)) continue;
    const score = pickNumber(value);
    if (score === undefined) continue;
    regions.push({
      id: key,
      name: pciFieldToLabel(key),
      score,
    });
  }

  regions.sort((a, b) => {
    const na = Number(a.id.match(/\d+/)?.[0] ?? 0);
    const nb = Number(b.id.match(/\d+/)?.[0] ?? 0);
    return na - nb;
  });

  return regions;
}

export function normalizeImagingResponse(raw: unknown): ImagingAnalysisResult {
  const data = asRecord(raw) ?? {};

  const ctRaw = data.ctResults ?? data.ct_results;
  const allSlices = Array.isArray(ctRaw)
    ? ctRaw.map((item, index) => normalizeCtSlice(item, index))
    : [];
  const ctResults = allSlices.filter((item) => item.image);
  const ctResultsTotal =
    pickNumber(data.ctResultsTotal, data.ct_results_total) ?? allSlices.length;
  const ctResultsTruncated = pickBoolean(data.ctResultsTruncated, data.ct_results_truncated);

  const pci = asRecord(data.pci);
  const regions = pci ? normalizePciRegions(pci) : [];

  const firstFilename = allSlices[0]?.filename;
  const sessionId = pickString(data.sessionId, data.session_id);

  return {
    status: pickString(data.status),
    studyId: sessionId ?? firstFilename ?? `IMG${Date.now()}`,
    dicomCount: pickNumber(data.ctCount, data.ct_count) ?? ctResultsTotal,
    ctResultsTotal,
    ctResultsTruncated,
    uploadedDicomCount: pickNumber(data.uploadedDicomCount, data.uploaded_dicom_count),
    ctResults,
    regions,
    totalPciScore: pci ? pickNumber(pci.pciScore, pci.pci_score) : undefined,
    isPositive: pci ? pickNumber(pci.isPositive, pci.is_positive) : undefined,
    positiveRate: pci ? pickNumber(pci.positiveRate, pci.positive_rate) : undefined,
    diagnosis: pci
      ? pickString(pci.conclusion, pci.diagnosis, pci.summary)
      : undefined,
    raw,
  };
}

function isZipFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed"
  );
}

function isDicomFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".dcm") || name.endsWith(".dicom");
}

async function parseErrorResponse(res: Response, bodyText: string): Promise<string> {
  if (bodyText.trim() === "Internal Server Error") {
    return "服务器内部错误，请稍后重试";
  }
  let detail = `分析失败 (${res.status})`;
  try {
    const err = JSON.parse(bodyText) as { detail?: unknown };
    if (typeof err.detail === "string") detail = err.detail;
    else if (Array.isArray(err.detail)) {
      detail = err.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join("；");
    } else if (bodyText.trim()) {
      detail = bodyText.trim().slice(0, 400);
    }
  } catch {
    if (bodyText.trim()) detail = bodyText.trim().slice(0, 400);
  }
  return detail;
}

/** 上传 ZIP 或 DICOM → BFF 解压并转发 CT 接口 */
export async function uploadImagingZipForAnalysis(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<ImagingAnalysisResult> {
  if (!isZipFile(file) && !isDicomFile(file)) {
    throw new Error("请上传 DICOM 压缩包（.zip）或 .dcm 文件");
  }

  const started = Date.now();
  const tick = (phase: UploadProgress["phase"], message: string) => {
    onProgress?.({
      phase,
      message,
      elapsedSec: Math.floor((Date.now() - started) / 1000),
    });
  };

  tick("uploading", "正在上传影像…");

  const form = new FormData();
  form.append("file", file, file.name);

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 600_000);

  const progressTimer = window.setInterval(() => {
    tick("analyzing", "CT 分割 + PCI 评分分析中，预计 3-5 分钟…");
  }, 3000);

  tick("analyzing", "CT 分割 + PCI 评分分析中，预计 3-5 分钟…");

  let res: Response;
  try {
    res = await fetch(UPLOAD_API, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("分析超时（超过 10 分钟），请稍后重试");
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
    window.clearInterval(progressTimer);
  }

  const bodyText = await res.text();

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, bodyText));
  }

  let json: unknown;
  try {
    json = JSON.parse(bodyText);
  } catch {
    throw new Error("CT 服务返回格式异常，响应过大或格式错误");
  }

  const result = normalizeImagingResponse(json);

  if (result.status && result.status !== "done") {
    throw new Error(`分析未完成：${result.status}`);
  }

  return result;
}

export async function checkImagingApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${CT_HEALTH_PROXY}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json?.status === "ok";
  } catch {
    return false;
  }
}
