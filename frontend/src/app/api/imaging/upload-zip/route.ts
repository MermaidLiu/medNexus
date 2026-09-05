import { NextRequest, NextResponse } from "next/server";
import { extractDicomFilesFromZipBuffer } from "@/lib/zip-dicom-server";
import { slimImagingApiResponse } from "@/lib/imaging-slim";

export const runtime = "nodejs";
export const maxDuration = 600;

const CT_API = (process.env.IMAGING_API_URL ?? "http://42.81.102.195:8000").replace(
  /\/$/,
  ""
);

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ detail: "请上传 .zip 文件" }, { status: 400 });
    }

    const filename = file instanceof File ? file.name : "upload.zip";
    if (!filename.toLowerCase().endsWith(".zip")) {
      return NextResponse.json({ detail: "请上传 .zip 压缩包" }, { status: 400 });
    }

    const zipBytes = Buffer.from(await file.arrayBuffer());
    if (zipBytes.length === 0) {
      return NextResponse.json({ detail: "ZIP 文件为空" }, { status: 400 });
    }

    const dicomFiles = extractDicomFilesFromZipBuffer(zipBytes);
    if (dicomFiles.length === 0) {
      return NextResponse.json(
        { detail: "ZIP 中未找到有效 DICOM 文件" },
        { status: 400 }
      );
    }

    const uploadForm = new FormData();
    for (const item of dicomFiles) {
      uploadForm.append(
        "files",
        new Blob([item.data], { type: "application/dicom" }),
        item.name
      );
    }
    uploadForm.append("runPci", "true");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 600_000);

    let upstream: Response;
    try {
      upstream = await fetch(`${CT_API}/ct-module/dicom/upload`, {
        method: "POST",
        body: uploadForm,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const bodyText = await upstream.text();
    if (!upstream.ok) {
      return new NextResponse(bodyText, {
        status: upstream.status,
        headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
      });
    }

    let json: unknown;
    try {
      json = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ detail: "CT 服务返回格式异常" }, { status: 502 });
    }

    const slim = slimImagingApiResponse(json, dicomFiles.length);
    return NextResponse.json(slim);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ detail: "CT 分析超时（超过 10 分钟），请稍后重试" }, { status: 504 });
    }
    const message = err instanceof Error ? err.message : "影像分析失败";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
