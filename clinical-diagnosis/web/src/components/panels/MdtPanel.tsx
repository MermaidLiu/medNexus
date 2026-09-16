"use client";

import { useEffect, useState } from "react";
import { useDiagnosis } from "@/context/DiagnosisContext";

const MDT_KEY = "ovarian_mdt_notes";

type MdtNote = { id: string; title: string; content: string; createdAt: string };

export function MdtPanel() {
  const { doctor, openAuthModal } = useDiagnosis();
  const [notes, setNotes] = useState<MdtNote[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MDT_KEY);
      if (raw) setNotes(JSON.parse(raw) as MdtNote[]);
    } catch {
      /* ignore */
    }
  }, []);

  const save = () => {
    if (!title.trim()) return;
    const note: MdtNote = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [note, ...notes];
    setNotes(next);
    localStorage.setItem(MDT_KEY, JSON.stringify(next));
    setTitle("");
    setContent("");
  };

  if (!doctor) {
    return (
      <div className="flex min-h-dvh flex-1 flex-col bg-[#f4f6f9]">
        <header className="border-b border-slate-200 bg-white px-8 py-6">
          <h1 className="text-xl font-semibold text-slate-900">MDT 病例讨论</h1>
        </header>
        <div className="p-8">
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">登录后记录 MDT 讨论要点</p>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm text-white"
            >
              医生登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[#f4f6f9]">
      <header className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-xl font-semibold text-slate-900">MDT 病例讨论</h1>
        <p className="mt-1 text-sm text-slate-500">多学科会诊备忘 — 本地保存</p>
      </header>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <input
              className="input-field mb-3"
              placeholder="病例标题 / 患者标识"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="input-field min-h-[100px]"
              placeholder="MDT 讨论要点、结论、待办…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button
              type="button"
              onClick={save}
              className="mt-3 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 px-5 py-2 text-sm font-medium text-white"
            >
              保存备忘
            </button>
          </div>

          {notes.map((n) => (
            <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-medium text-slate-900">{n.title}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {new Date(n.createdAt).toLocaleString("zh-CN")}
              </p>
              {n.content && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{n.content}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
