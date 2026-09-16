"use client";

import { useEffect, useState } from "react";
import { IconExternalLink } from "@/components/IconFont";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { CORE_LITERATURE, LITERATURE_SAVE_KEY } from "@/lib/sidebar-nav";
import { EmptyAuth, PanelShell } from "@/components/panels/MyDiagnosesPanel";

export function LiteraturePanel() {
  const { doctor, openAuthModal } = useDiagnosis();
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LITERATURE_SAVE_KEY);
      if (raw) setSaved(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(LITERATURE_SAVE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const savedItems = CORE_LITERATURE.filter((p) => saved.has(p.id));
  const allItems = CORE_LITERATURE;

  return (
    <PanelShell title="文献收录" desc="卵巢癌 / 妇科肿瘤核心文献 — 收藏与速查">
      {!doctor && (
        <div className="mb-6">
          <EmptyAuth onLogin={() => openAuthModal("login")} message="登录后可同步个人文献收藏" />
        </div>
      )}

      {savedItems.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">我的收藏</h2>
          <div className="space-y-3">
            {savedItems.map((p) => (
              <LitCard key={p.id} paper={p} saved={saved.has(p.id)} onToggle={() => toggleSave(p.id)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">卵巢癌核心文献库</h2>
        <div className="space-y-3">
          {allItems.map((p) => (
            <LitCard key={p.id} paper={p} saved={saved.has(p.id)} onToggle={() => toggleSave(p.id)} />
          ))}
        </div>
      </section>
    </PanelShell>
  );
}

function LitCard({
  paper,
  saved,
  onToggle,
}: {
  paper: (typeof CORE_LITERATURE)[number];
  saved: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug text-slate-900">{paper.title}</p>
          <p className="mt-1 text-xs text-slate-500">{paper.journal}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {paper.tags.map((t) => (
              <span key={t} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">
                {t}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium ${
            saved ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {saved ? "已收藏" : "收藏"}
        </button>
      </div>
      <a
        href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs text-rose-600 hover:underline"
      >
        PubMed
        <IconExternalLink size={12} color="currentColor" />
      </a>
    </div>
  );
}
