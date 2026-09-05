/** 从 CT 分割标注图提取二值 ROI Mask（白=ROI，黑=背景） */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("无法加载图像"));
    img.src = src;
  });
}

function isAnnotationPixel(r: number, g: number, b: number): boolean {
  // 红色 / 品红勾画（CT 接口常见标注色）
  const isRed = r > 140 && g < 110 && b < 110 && r - Math.max(g, b) > 35;
  // 高饱和彩色叠加（非灰度 CT 底图）
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const isColorOverlay = saturation > 0.35 && max > 80 && min < 180;
  return isRed || isColorOverlay;
}

/** 从标注叠加图提取二值 mask PNG（data URL） */
export async function extractMaskFromOverlay(overlaySrc: string): Promise<string> {
  const img = await loadImage(overlaySrc);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 不可用");

  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const out = ctx.createImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const on = isAnnotationPixel(r, g, b) ? 255 : 0;
    out.data[i] = on;
    out.data[i + 1] = on;
    out.data[i + 2] = on;
    out.data[i + 3] = 255;
  }

  ctx.putImageData(out, 0, 0);
  return canvas.toDataURL("image/png");
}

/** 将 mask 半透明叠加到原标注图（预览用） */
export async function blendMaskOverlay(
  overlaySrc: string,
  maskSrc: string,
  color: [number, number, number] = [34, 197, 94]
): Promise<string> {
  const [overlay, mask] = await Promise.all([loadImage(overlaySrc), loadImage(maskSrc)]);
  const canvas = document.createElement("canvas");
  canvas.width = overlay.naturalWidth || overlay.width;
  canvas.height = overlay.naturalHeight || overlay.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 不可用");

  ctx.drawImage(overlay, 0, 0);
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const mctx = maskCanvas.getContext("2d")!;
  mctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
  const maskData = mctx.getImageData(0, 0, canvas.width, canvas.height);
  const tint = ctx.createImageData(canvas.width, canvas.height);

  for (let i = 0; i < maskData.data.length; i += 4) {
    if (maskData.data[i] > 128) {
      tint.data[i] = color[0];
      tint.data[i + 1] = color[1];
      tint.data[i + 2] = color[2];
      tint.data[i + 3] = 120;
    }
  }

  ctx.putImageData(tint, 0, 0);
  return canvas.toDataURL("image/png");
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** 无依赖 ZIP（Stored）批量导出 mask PNG */
export function buildStoredZip(files: { name: string; data: Uint8Array }[]): Blob {
  const parts: BlobPart[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(8, 0, true);
    view.setUint32(18, file.data.length, true);
    view.setUint32(22, file.data.length, true);
    view.setUint16(26, nameBytes.length, true);
    header.set(nameBytes, 30);
    parts.push(header, file.data);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cd.buffer);
    cdView.setUint32(0, 0x02014b50, true);
    cdView.setUint16(10, 0, true);
    cdView.setUint32(20, file.data.length, true);
    cdView.setUint32(24, file.data.length, true);
    cdView.setUint16(28, nameBytes.length, true);
    cdView.setUint32(42, offset, true);
    cd.set(nameBytes, 46);
    central.push(cd);

    offset += header.length + file.data.length;
  }

  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const centralStart = offset;
  for (const c of central) parts.push(c);

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, centralSize, true);
  eocdView.setUint32(16, centralStart, true);
  parts.push(eocd);

  return new Blob(parts, { type: "application/zip" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportMasksZip(
  items: { filename?: string; maskDataUrl: string }[],
  zipName = "roi_masks.zip"
) {
  const files = items.map((item, index) => {
    const base = (item.filename ?? `slice_${index + 1}`).replace(/\.[^.]+$/, "");
    return {
      name: `${base}_mask.png`,
      data: dataUrlToBytes(item.maskDataUrl),
    };
  });
  downloadBlob(buildStoredZip(files), zipName);
}

export function maskFilename(dicomName?: string, index?: number): string {
  const base = (dicomName ?? `slice_${(index ?? 0) + 1}`).replace(/\.[^.]+$/, "");
  return `${base}_mask.png`;
}
