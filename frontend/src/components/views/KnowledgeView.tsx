"use client";

import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { DiseaseIcon, type DiseaseIconName } from "@/components/IconFont";
import { useEditionTheme } from "@/hooks/useEditionTheme";

/** 垂类知识库 — 妇科肿瘤亚专科 + 关键试验 */
export function KnowledgeView() {
  const { config } = useApp();
  const router = useRouter();
  const theme = useEditionTheme();

  if (!config) {
    return <div className="p-8 text-slate-400">加载知识库…</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-5xl px-8 py-8">
        <section>
          <h2 className="text-lg font-bold text-slate-900">妇科肿瘤亚专科</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {config.disease_areas.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <DiseaseIcon name={d.icon as DiseaseIconName} size={28} color={theme.iconColor} />
                <p className="mt-3 font-semibold text-slate-900">{d.name}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.topics.map((t) => (
                    <span key={t} className={`rounded-md px-2 py-0.5 text-xs ${theme.chipClass}`}>
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => router.push(`/?q=${encodeURIComponent(d.name)}`)}
                  className={`mt-4 text-xs font-medium hover:underline ${theme.linkClass}`}
                >
                  在科学导航中搜索 →
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-bold text-slate-900">Landmark 临床试验</h2>
          <div className="mt-5 space-y-3">
            {config.featured_trials.map((t) => (
              <div
                key={t.name}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${theme.badgeClass}`}>
                  {t.name}
                </span>
                <div>
                  <p className="text-xs text-slate-400">{t.disease}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{t.finding}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
