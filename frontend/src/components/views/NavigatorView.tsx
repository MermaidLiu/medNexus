"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { navigatorSearch, type NavigatorSearchResult } from "@/lib/navigator";
import { createStudy, runPipeline } from "@/lib/api";
import { DiseaseIcon, type DiseaseIconName } from "@/components/IconFont";

/** 玻尔式科学导航 — 主工作区（无独立 header） */
export function NavigatorView() {
  const router = useRouter();
  const { config, backendOnline } = useApp();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState<NavigatorSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (q?: string) => {
    const text = (q ?? query).trim();
    if (text.length < 5) return;
    setSearching(true);
    setError(null);
    setQuery(text);
    try {
      setResult(await navigatorSearch(text));
    } catch (e) {
      setError(
        backendOnline
          ? `检索失败：${e instanceof Error ? e.message : "未知错误"}`
          : "后端未连接。请运行：cd backend && uvicorn app.main:app --reload --port 8000，然后重启前端 npm run dev"
      );
    } finally {
      setSearching(false);
    }
  }, [query, backendOnline]);

  const handleLaunch = async () => {
    const topic = result?.refined_question ?? query;
    if (!topic) return;
    setLaunching(true);
    try {
      const study = await createStudy(topic);
      const running = await runPipeline(study.id);
      router.push(`/research?id=${running.id}`);
    } catch {
      setError("启动深度研究失败");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto scrollbar-thin px-8 py-10">
      {/* Hero — 玻尔：从科研问题开始 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          从一个<span className="text-rose-600">科研问题</span>开始
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {config?.tagline ?? "读文献 · 算数据 · 做产出"}
        </p>
      </div>

      {/* 搜索框 */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入妇科肿瘤科研问题…"
          rows={3}
          className="w-full resize-none rounded-xl px-4 py-3 text-sm focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <div className="flex justify-between px-2 pb-1">
          <span className="text-[11px] text-slate-400">Enter 搜索</span>
          <button
            onClick={() => handleSearch()}
            disabled={searching || query.trim().length < 5}
            className="rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {searching ? "检索中…" : "科学导航搜索"}
          </button>
        </div>
      </div>

      {config && (
        <div className="mt-3 flex flex-wrap gap-2">
          {config.suggested_questions.slice(0, 4).map((q) => (
            <button
              key={q}
              onClick={() => handleSearch(q)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-rose-300"
            >
              {q.slice(0, 24)}…
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {/* 搜索结果 — 玻尔：答案 + 参考文献 + 深度研究 */}
      {result && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-slate-900">导航回答</h3>
            <div className="flex gap-2">
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="rounded-lg bg-gradient-to-r from-rose-500 to-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {launching ? "启动中…" : "深度研究 →"}
              </button>
            </div>
          </div>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-sans">
            {result.answer}
          </pre>
          {result.papers.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">参考文献</p>
              {result.papers.map((p, i) => (
                <p key={i} className="text-xs text-slate-600">
                  {String(p.title)} · {String(p.authors)} ({String(p.year)})
                </p>
              ))}
            </div>
          )}
          {result.suggested_followups.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">推荐追问</p>
              <div className="flex flex-wrap gap-2">
                {result.suggested_followups.map((f) => (
                  <button
                    key={f}
                    onClick={() => handleSearch(f)}
                    className="rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600 hover:bg-rose-50"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 无结果时展示读算做 + 亚专科 */}
      {!result && config && (
        <>
          <Link
            href="/clinical/nact-ovarian"
            className="mt-8 flex items-center gap-4 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-violet-50 p-5 transition hover:shadow-md"
          >
            <DiseaseIcon name="ovarian" size={32} color="#e11d48" />
            <div className="min-w-0 flex-1 text-left">
              <p className="font-semibold text-slate-900">卵巢癌 NACT 多模态决策</p>
              <p className="mt-1 text-xs text-slate-600">
                临床 + 影像 PCI + 病理/分子 → 预测化疗敏感性与减瘤术转归
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white">
              进入临床决策 →
            </span>
          </Link>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {config.read_compute_do.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-bold text-rose-600">{p.title}</p>
                <p className="mt-1 text-xs text-slate-400">{p.subtitle}</p>
                <p className="mt-2 text-xs text-slate-600">{p.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold text-slate-800">妇科肿瘤亚专科</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {config.disease_areas.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleSearch(`${d.name} ${d.topics[0]} 研究进展`)}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-rose-200 hover:shadow-sm"
                >
                  <DiseaseIcon
                    name={d.icon as DiseaseIconName}
                    size={24}
                    color="#e11d48"
                  />
                  <p className="text-sm font-medium text-slate-800">{d.name}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
