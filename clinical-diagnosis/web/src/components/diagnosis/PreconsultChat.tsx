"use client";

import { useCallback, useRef, useState } from "react";
import type { DiagnosisVisit } from "@/lib/diagnosis-types";

export type ChatMessage = { role: "user" | "assistant"; content: string };

async function sendPreconsultChat(
  messages: ChatMessage[],
  context: { chiefComplaint?: string; patientName?: string; age?: number }
): Promise<string> {
  const res = await fetch("/api/v1/diagnosis/preconsult-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "对话失败");
  }
  const data = (await res.json()) as { reply: string };
  return data.reply;
}

export function PreconsultChat({
  visit,
  messages,
  onMessagesChange,
  onSyncToForm,
  onPersist,
}: {
  visit: DiagnosisVisit;
  messages: ChatMessage[];
  onMessagesChange: (m: ChatMessage[]) => void;
  onSyncToForm?: (text: string) => void;
  onPersist?: (m: ChatMessage[]) => void;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    onMessagesChange(next);
    setBusy(true);
    scrollDown();
    try {
      const reply = await sendPreconsultChat(next, {
        chiefComplaint: visit.registration.chiefComplaint,
        patientName: visit.registration.patientName,
        age: visit.registration.age,
      });
      onMessagesChange([...next, { role: "assistant", content: reply }]);
      scrollDown();
      onPersist?.([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setBusy(false);
    }
  }, [input, busy, messages, onMessagesChange, onPersist, visit.registration]);

  const startConversation = async () => {
    if (messages.length > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const reply = await sendPreconsultChat([], {
        chiefComplaint: visit.registration.chiefComplaint,
        patientName: visit.registration.patientName,
        age: visit.registration.age,
      });
      onMessagesChange([{ role: "assistant", content: reply }]);
      scrollDown();
      onPersist?.([{ role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "启动失败");
    } finally {
      setBusy(false);
    }
  };

  const syncSummary = () => {
    const userTexts = messages.filter((m) => m.role === "user").map((m) => m.content);
    if (userTexts.length && onSyncToForm) {
      onSyncToForm(userTexts.join("；"));
    }
  };

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50/80 to-white shadow-sm">
      <div className="flex items-center justify-between border-b border-violet-100 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-violet-900">智能预问诊对话</p>
          <p className="mt-0.5 text-xs text-violet-600/80">Powered by 大模型 · 自动梳理病史</p>
        </div>
        {messages.some((m) => m.role === "user") && (
          <button
            type="button"
            onClick={syncSummary}
            className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-[11px] text-violet-700 hover:bg-violet-50"
          >
            同步到症状栏
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">AI 将根据挂号信息引导您补充病史</p>
            <button
              type="button"
              onClick={startConversation}
              disabled={busy}
              className="mt-4 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "连接中…" : "开始智能对话"}
            </button>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-rose-600 text-white rounded-br-md"
                    : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-100 rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {busy && messages.length > 0 && (
          <p className="text-xs text-slate-400 animate-pulse">AI 思考中…</p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="border-t border-red-100 bg-red-50 px-5 py-2 text-xs text-red-600">{error}</p>}

      {messages.length > 0 && (
        <div className="flex gap-2 border-t border-violet-100 bg-white p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="描述症状、检查结果…"
            disabled={busy}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !input.trim()}
            className="shrink-0 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            发送
          </button>
        </div>
      )}
    </div>
  );
}
