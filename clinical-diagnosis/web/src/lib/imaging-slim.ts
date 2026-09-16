/** 瘦身 CT 接口响应，避免浏览器 JSON.parse 超大 base64 卡死 */

const MAX_SLICES_WITH_IMAGE = 120;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function slimImagingApiResponse(raw: unknown, uploadedCount: number): unknown {
  const data = asRecord(raw);
  if (!data) return raw;

  const ctRaw = data.ctResults ?? data.ct_results;
  if (!Array.isArray(ctRaw)) return raw;

  const total = ctRaw.length;
  const slimResults = ctRaw.map((item, index) => {
    const row = asRecord(item) ?? {};
    const filename = row.filename ?? row.fileName ?? row.name ?? `slice_${index}`;
    const slim: Record<string, unknown> = { filename };

    if (index < MAX_SLICES_WITH_IMAGE) {
      const png = row.pngBase64 ?? row.png_base64;
      const result = row.resultBase64 ?? row.result_base64;
      const mask =
        row.maskBase64 ??
        row.mask_base64 ??
        row.labelBase64 ??
        row.label_base64;

      if (typeof png === "string" && png.length > 0) slim.pngBase64 = png;
      if (typeof result === "string" && result.length > 0) slim.resultBase64 = result;
      if (typeof mask === "string" && mask.length > 0) slim.maskBase64 = mask;
    }

    return slim;
  });

  return {
    ...data,
    ctCount: data.ctCount ?? data.ct_count ?? total,
    uploadedDicomCount: uploadedCount,
    ctResultsTotal: total,
    ctResultsTruncated: total > MAX_SLICES_WITH_IMAGE,
    ctResults: slimResults,
  };
}
