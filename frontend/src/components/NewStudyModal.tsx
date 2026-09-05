"use client";

import { useState } from "react";
import { IconX } from "./Icons";

interface Props {
  onSubmit: (topic: string) => void;
  onClose: () => void;
  loading?: boolean;
  initialTopic?: string;
}

const DEMO_TOPIC =
  "铂敏感复发卵巢癌患者中，PARP抑制剂维持治疗 vs 安慰剂，PFS 和 OS 获益如何？";

export function NewStudyModal({ onSubmit, onClose, loading, initialTopic = "" }: Props) {
  const [topic, setTopic] = useState(initialTopic);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">新建研究</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            研究主题（自然语言描述）
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="描述您的科研问题，Agent 将自动拆解任务流水线…"
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
          />
          <button
            type="button"
            onClick={() => setTopic(DEMO_TOPIC)}
            className="mt-2 text-xs text-rose-600 hover:underline"
          >
            使用示例：PARP 抑制剂维持治疗 PFS
          </button>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            取消
          </button>
          <button
            onClick={() => topic.trim() && onSubmit(topic.trim())}
            disabled={loading || topic.trim().length < 10}
            className="rounded-lg bg-gradient-to-r from-rose-500 to-violet-600 px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "创建中…" : "启动 Agent 流水线"}
          </button>
        </div>
      </div>
    </div>
  );
}
