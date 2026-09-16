"use client";

import { useState } from "react";
import { useEditionTheme } from "@/hooks/useEditionTheme";

export function CohortImportModal({
  onClose,
  onImport,
  hasData,
}: {
  onClose: () => void;
  onImport: (file: File, mode: "replace" | "append") => Promise<void>;
  hasData: boolean;
}) {
  const theme = useEditionTheme();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setErr(null);
    try {
      await onImport(file, mode);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "导入失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">导入 91 例 Excel</h3>
          <p className="mt-1 text-xs text-slate-500">数据将用于 NACT 多模态预测，导入后可在左侧队列中选择病例</p>
        </div>
        <div className="space-y-4 px-5 py-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            className={`block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-xs ${theme.fileInputClass}`}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {hasData && (
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} />
                覆盖现有队列
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={mode === "append"} onChange={() => setMode("append")} />
                追加
              </label>
            </div>
          )}
          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">
            取消
          </button>
          <button
            onClick={submit}
            disabled={!file || loading}
            className={`rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50 ${theme.btnPrimaryClass}`}
          >
            {loading ? "导入中…" : "确认导入"}
          </button>
        </div>
      </div>
    </div>
  );
}
