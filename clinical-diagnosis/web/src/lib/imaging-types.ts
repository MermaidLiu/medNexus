/** PCI 区域字段 → 中文标签（CT+PCI 接口 pci 对象） */
export const PCI_REGION_LABELS: Record<string, string> = {
  pci0Central: "0 中央区",
  pci1RightUpper: "1 右上区域",
  pci2Epigastric: "2 上胃区",
  pci3LeftUpper: "3 左上区域",
  pci4LeftFlank: "4 左侧腹部区域",
  pci5LeftLower: "5 左下区域",
  pci6Pelvis: "6 盆腔区域",
  pci7RightLower: "7 右下区域",
  pci8RightFlank: "8 右侧腹部区域",
  pci9RightUpperAbdomen: "9 右上腹区",
  pci10UpperJejunum: "10 上空肠",
  pci11LowerJejunum: "11 下空肠",
  pci12LowerIleum: "12 下回肠",
};

export function pciFieldToLabel(key: string): string {
  if (PCI_REGION_LABELS[key]) return PCI_REGION_LABELS[key];
  const match = key.match(/^pci(\d+)([A-Za-z].*)?$/);
  if (!match) return key;
  const num = match[1];
  const tail = match[2] ?? "";
  const words = tail.replace(/([A-Z])/g, " $1").trim();
  return words ? `${num} ${words}` : `${num} 区域`;
}

export interface CtSliceResult {
  index: number;
  image?: string;
  baseImage?: string;
  maskImage?: string;
  label?: string;
  filename?: string;
}

export interface PciRegionResult {
  id: string;
  name: string;
  score: number;
}

export interface ImagingAnalysisResult {
  studyId: string;
  status?: string;
  dicomCount?: number;
  ctResultsTotal?: number;
  ctResultsTruncated?: boolean;
  uploadedDicomCount?: number;
  ctResults: CtSliceResult[];
  regions: PciRegionResult[];
  totalPciScore?: number;
  isPositive?: number;
  positiveRate?: number;
  diagnosis?: string;
  raw: unknown;
}
