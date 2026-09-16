"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconLoader } from "@/components/IconFont";
import { useEditionTheme } from "@/hooks/useEditionTheme";
import type { EditionTheme } from "@/lib/agent-editions";
import {
  blendMaskOverlay,
  downloadBlob,
  exportMasksZip,
  extractMaskFromOverlay,
  maskFilename,
} from "@/lib/mask-extract";
import { checkImagingApiHealth, uploadImagingZipForAnalysis, type UploadProgress } from "@/lib/imaging-api";
import { IMAGING_SESSION_KEY } from "@/lib/nact-types";
import type { ImagingAnalysisResult } from "@/lib/imaging-types";

function scoreBadgeClass(score: number) {
  if (score >= 3) return "bg-rose-100 text-rose-700 ring-rose-200";
  if (score >= 2) return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-emerald-100 text-emerald-700 ring-emerald-200";
}

function UploadPanel({
  theme,
  onAnalyze,
  loading,
  apiOnline,
  progress,
}: {
  theme: EditionTheme;
  onAnalyze: (file: File) => void;
  loading: boolean;
  apiOnline: boolean | null;
  progress: UploadProgress | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setPickError(null);
    if (list.length > 1) {
      setPickError("请上传单个 ZIP 压缩包，不要分多个文件");
      return;
    }
    const file = list[0];
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setPickError("仅支持 .zip 格式，请将 DICOM 序列打包后上传");
      return;
    }
    onAnalyze(file);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            apiOnline === null ? "bg-slate-300" : apiOnline ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
        <span className="text-xs text-slate-500">
          {apiOnline === null
            ? "检测 CT 分析服务…"
            : apiOnline
              ? "CT+PCI 分析服务已连接"
              : "CT 分析服务未连接 · 请确认前端已重启且 CT 服务可达"}
        </span>
      </div>

      <h2 className="text-xl font-semibold text-slate-900">影像数据标注与病理分级</h2>
      <p className="mt-2 max-w-lg text-center text-sm leading-relaxed text-slate-500">
        上传包含 DICOM 序列的 ZIP 压缩包，系统自动完成 CT 分割标注与 PCI 区域评分，并生成诊断结论。
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mt-8 flex w-full cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-8 py-14 transition-colors ${
          dragOver
            ? theme.dropZoneActiveClass
            : `border-slate-200 bg-white ${theme.dropZoneHoverClass} hover:bg-slate-50`
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <span className={theme.loaderClass}>
              <IconLoader size={28} />
            </span>
            <p className="text-sm">{progress?.message ?? "正在处理，请稍候…"}</p>
            <p className="text-xs text-slate-400">
              {progress
                ? `已等待 ${Math.floor(progress.elapsedSec / 60)}:${String(progress.elapsedSec % 60).padStart(2, "0")}`
                : "上传 · 解压 · 分割标注 · PCI 评分"}
            </p>
            <p className="text-[11px] text-slate-400">请勿关闭页面，分析通常需 3-5 分钟</p>
          </div>
        ) : (
          <>
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${theme.uploadIconBgClass}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700">拖拽 ZIP 压缩包到此处，或点击上传</p>
            <p className="mt-1 text-xs text-slate-400">请将整套 DICOM 序列打包为单个 .zip 上传</p>
          </>
        )}
      </div>
      {pickError && (
        <p className="mt-3 text-center text-xs text-red-600">{pickError}</p>
      )}
    </div>
  );
}

type ViewMode = "overlay" | "mask" | "blend";

function ViewerPanel({
  theme,
  result,
  onReset,
}: {
  theme: EditionTheme;
  result: ImagingAnalysisResult;
  onReset: () => void;
}) {
  const [sliceIndex, setSliceIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("overlay");
  const [maskCache, setMaskCache] = useState<Record<number, string>>({});
  const [blendCache, setBlendCache] = useState<Record<number, string>>({});
  const maskCacheRef = useRef<Record<number, string>>({});
  const [maskLoading, setMaskLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const slices = result.ctResults;
  const current = slices[sliceIndex];

  const goPrev = useCallback(() => {
    setSliceIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setSliceIndex((i) => Math.min(slices.length - 1, i + 1));
  }, [slices.length]);

  const getMaskForSlice = useCallback(
    async (index: number): Promise<string | null> => {
      const slice = slices[index];
      if (!slice?.image) return null;
      if (maskCacheRef.current[index]) return maskCacheRef.current[index];
      if (slice.maskImage) {
        maskCacheRef.current[index] = slice.maskImage;
        setMaskCache({ ...maskCacheRef.current });
        return slice.maskImage;
      }
      const mask = await extractMaskFromOverlay(slice.image);
      maskCacheRef.current[index] = mask;
      setMaskCache({ ...maskCacheRef.current });
      return mask;
    },
    [slices]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  useEffect(() => {
    if (!current?.image || viewMode === "overlay") return;
    let cancelled = false;
    setMaskLoading(true);
    getMaskForSlice(sliceIndex)
      .then(async (mask) => {
        if (cancelled || !mask || !current.image) return;
        if (viewMode === "blend" && !blendCache[sliceIndex]) {
          const blended = await blendMaskOverlay(current.image, mask);
          if (!cancelled) {
            setBlendCache((prev) => ({ ...prev, [sliceIndex]: blended }));
          }
        }
      })
      .finally(() => {
        if (!cancelled) setMaskLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sliceIndex, viewMode, current?.image, getMaskForSlice]);

  const displayImage =
    viewMode === "mask"
      ? maskCache[sliceIndex]
      : viewMode === "blend"
        ? blendCache[sliceIndex] ?? current?.image
        : current?.image;

  const handleDownloadCurrentMask = async () => {
    const mask = await getMaskForSlice(sliceIndex);
    if (!mask) return;
    const blob = await fetch(mask).then((r) => r.blob());
    downloadBlob(blob, maskFilename(current?.filename, sliceIndex));
  };

  const handleExportAllMasks = async () => {
    setExporting(true);
    try {
      const items: { filename?: string; maskDataUrl: string }[] = [];
      for (let i = 0; i < slices.length; i++) {
        const mask = await getMaskForSlice(i);
        if (mask) items.push({ filename: slices[i].filename, maskDataUrl: mask });
      }
      if (items.length === 0) return;
      await exportMasksZip(items, `roi_masks_${result.studyId}.zip`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900">影像标注可视化</h2>
          {result.dicomCount != null && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {result.dicomCount} 张 CT 切片
            </span>
          )}
          {current?.filename && (
            <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-700">
              {current.filename}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            {(
              [
                ["overlay", "标注"],
                ["mask", "ROI Mask"],
                ["blend", "叠加"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-2.5 py-1 text-xs ${
                  viewMode === mode ? theme.selectedItemClass : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={handleDownloadCurrentMask}
            disabled={!current?.image || maskLoading}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            下载 Mask
          </button>
          <button
            onClick={handleExportAllMasks}
            disabled={slices.length === 0 || exporting}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
          >
            {exporting ? "导出中…" : "导出全部 ROI"}
          </button>
          <button
            onClick={onReset}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            重新上传
          </button>
        </div>
      </div>

      <p className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-6 py-2 text-xs text-slate-500">
        ← / → 翻阅切片 · ROI Mask 为二值图（白=勾画区域），可导出用于放疗勾画 / 科研标注
        {result.ctResultsTruncated && result.ctResultsTotal != null && (
          <span className="ml-2 text-amber-600">
            共 {result.ctResultsTotal} 张，已加载前 {result.ctResults.length} 张
          </span>
        )}
        {slices.length > 0 && (
          <span className="ml-2 text-slate-400">
            {sliceIndex + 1} / {slices.length}
          </span>
        )}
      </p>

      <div className="flex flex-1 min-h-0">
        <div className="relative flex flex-1 items-center justify-center bg-[#1a1a1a] p-4">
          {maskLoading && viewMode !== "overlay" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
              <span className="animate-spin text-white">
                <IconLoader size={24} />
              </span>
            </div>
          )}
          {displayImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt={`CT 切片 ${sliceIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
              <button
                onClick={goPrev}
                disabled={sliceIndex === 0}
                className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-30"
                aria-label="上一张"
              >
                ‹
              </button>
              <button
                onClick={goNext}
                disabled={sliceIndex >= slices.length - 1}
                className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-30"
                aria-label="下一张"
              >
                ›
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-400">未返回可展示的标注图像</p>
          )}
        </div>

        <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">PCI 评分结果</h3>
            {result.totalPciScore != null && (
              <p className="mt-1 text-xs text-slate-500">
                PCI 总分：
                <span className={`font-semibold ${theme.accentTextClass}`}>{result.totalPciScore}</span>
              </p>
            )}
            {result.positiveRate != null && (
              <p className="mt-0.5 text-xs text-slate-500">
                阳性概率：
                <span className="font-medium text-slate-700">
                  {(result.positiveRate * 100).toFixed(0)}%
                </span>
                {result.isPositive != null && (
                  <span className="ml-2 text-slate-400">
                    ({result.isPositive ? "阳性" : "阴性"})
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {result.regions.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-400">暂无 PCI 区域评分数据</p>
            ) : (
              <ul>
                {result.regions.map((region) => (
                  <li
                    key={region.id}
                    className="flex items-center justify-between border-b border-slate-50 px-4 py-3.5 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="truncate text-sm font-medium text-slate-800">{region.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">PCI 区域评分</p>
                    </div>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ring-1 ${scoreBadgeClass(region.score)}`}
                    >
                      {region.score}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {result.diagnosis && (
            <div className="shrink-0 border-t border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-600">诊断结论</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{result.diagnosis}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/** 影像数据标注与 PCI 病理分级 */
export function ImagingView() {
  const theme = useEditionTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImagingAnalysisResult | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  useEffect(() => {
    checkImagingApiHealth().then(setApiOnline);
  }, []);

  const handleAnalyze = async (file: File) => {
    setLoading(true);
    setError(null);
    setProgress(null);
    try {
      const data = await uploadImagingZipForAnalysis(file, setProgress);
      setResult(data);
      try {
        sessionStorage.setItem(
          IMAGING_SESSION_KEY,
          JSON.stringify({
            sessionId: data.studyId,
            totalPciScore: data.totalPciScore,
            ctCount: data.dicomCount,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {
        /* ignore */
      }
      if (data.ctResults.length === 0 && data.regions.length === 0) {
        setError("分析完成，但未解析到标注图像或 PCI 评分。");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  if (result && !loading) {
    return (
      <div className="flex flex-1 min-h-0 flex-col">
        {error && (
          <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-800">
            {error}
          </div>
        )}
        <ViewerPanel theme={theme} result={result} onReset={() => { setResult(null); setError(null); }} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <UploadPanel theme={theme} onAnalyze={handleAnalyze} loading={loading} apiOnline={apiOnline} progress={progress} />
      {error && (
        <p className="mx-auto -mt-8 mb-8 max-w-lg rounded-lg bg-red-50 px-4 py-2 text-center text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
