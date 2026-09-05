import { inflateRawSync } from "zlib";

const SKIP_RE = /(?:^|\/)(?:__MACOSX|\.DS_Store|Thumbs\.db)(?:\/|$)/i;

export interface ExtractedDicom {
  name: string;
  data: Buffer;
}

function readU16(buf: Buffer, offset: number): number {
  return buf.readUInt16LE(offset);
}

function readU32(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}

function hasDicomMagic(data: Buffer): boolean {
  return data.length >= 132 && data.subarray(128, 132).toString("ascii") === "DICM";
}

function isDicomName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".dcm") || lower.endsWith(".dicom");
}

function uniqueName(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return normalized.includes("/") ? normalized.replace(/\//g, "__") : normalized;
}

interface ZipEntry {
  name: string;
  compression: number;
  compSize: number;
  uncompSize: number;
  localOffset: number;
}

function findEndOfCentralDirectory(buf: Buffer): number {
  const minOffset = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= minOffset; i--) {
    if (readU32(buf, i) === 0x06054b50) return i;
  }
  return -1;
}

function parseCentralDirectory(buf: Buffer): ZipEntry[] {
  const eocd = findEndOfCentralDirectory(buf);
  if (eocd < 0) throw new Error("无法读取 ZIP 文件，请确认压缩包未损坏");

  const totalEntries = readU16(buf, eocd + 10);
  const centralOffset = readU32(buf, eocd + 16);
  const entries: ZipEntry[] = [];
  let offset = centralOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (readU32(buf, offset) !== 0x02014b50) break;

    const nameLen = readU16(buf, offset + 28);
    const extraLen = readU16(buf, offset + 30);
    const commentLen = readU16(buf, offset + 32);

    entries.push({
      name: buf.toString("utf8", offset + 46, offset + 46 + nameLen),
      compression: readU16(buf, offset + 10),
      compSize: readU32(buf, offset + 20),
      uncompSize: readU32(buf, offset + 24),
      localOffset: readU32(buf, offset + 42),
    });

    offset += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

function readEntryData(buf: Buffer, entry: ZipEntry): Buffer {
  const offset = entry.localOffset;
  if (readU32(buf, offset) !== 0x04034b50) {
    throw new Error(`ZIP 条目损坏：${entry.name}`);
  }

  const nameLen = readU16(buf, offset + 26);
  const extraLen = readU16(buf, offset + 28);
  const dataStart = offset + 30 + nameLen + extraLen;
  const compressed = buf.subarray(dataStart, dataStart + entry.compSize);

  if (entry.compression === 0) return compressed;
  if (entry.compression === 8) return inflateRawSync(compressed);
  throw new Error(`不支持的 ZIP 压缩格式（${entry.name}）`);
}

/** Node 端解压 ZIP（比浏览器快一个数量级） */
export function extractDicomFilesFromZipBuffer(zipBytes: Buffer): ExtractedDicom[] {
  const entries = parseCentralDirectory(zipBytes);
  const dicomFiles: ExtractedDicom[] = [];

  for (const entry of entries) {
    if (!entry.name || entry.uncompSize === 0) continue;
    if (SKIP_RE.test(entry.name)) continue;

    const basename = entry.name.split("/").pop() ?? entry.name;
    const lower = basename.toLowerCase();
    if (lower.endsWith(".txt") || lower.endsWith(".xml") || lower.endsWith(".json")) {
      continue;
    }

    const data = readEntryData(zipBytes, entry);
    if (isDicomName(basename) || hasDicomMagic(data)) {
      dicomFiles.push({ name: uniqueName(entry.name), data });
    }
  }

  return dicomFiles;
}
