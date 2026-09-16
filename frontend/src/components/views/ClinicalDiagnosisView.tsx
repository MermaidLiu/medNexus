"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MiniProgramQrButton } from "@/components/diagnosis/MiniProgramQrButton";
import { PreconsultChat, type ChatMessage } from "@/components/diagnosis/PreconsultChat";
import {
  createDiagnosisVisit,
  fetchDiagnosisVisit,
  isImagingImage,
  isImagingZip,
  nextStep,
  patchDiagnosisVisit,
  prevStep,
  readFileAsDataUrl,
  runAiDiagnosis,
  uploadVisitImaging,
} from "@/lib/diagnosis-api";
import {
  DEFAULT_BLOOD_FIELDS,
  DEFAULT_URINE_FIELDS,
  DIAGNOSIS_STEPS,
  DIAGNOSIS_VISIT_KEY,
  GUIDELINE_OPTIONS,
  type DiagnosisStepId,
  type DiagnosisVisit,
} from "@/lib/diagnosis-types";

type Props = { mobile?: boolean };

export function ClinicalDiagnosisView({ mobile }: Props) {
  const [visit, setVisit] = useState<DiagnosisVisit | null>(null);
  const [step, setStep] = useState<DiagnosisStepId>("registration");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagingBusy, setImagingBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const savedId = localStorage.getItem(DIAGNOSIS_VISIT_KEY);
      if (savedId) {
        try {
          const v = await fetchDiagnosisVisit(savedId);
          setVisit(v);
          setStep(v.currentStep ?? "registration");
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem(DIAGNOSIS_VISIT_KEY);
        }
      }
      const v = await createDiagnosisVisit();
      localStorage.setItem(DIAGNOSIS_VISIT_KEY, v.id);
      setVisit(v);
      setStep("registration");
    } catch {
      setError("无法连接后端，请启动 backend :8000");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const savePatch = async (patch: Partial<DiagnosisVisit>, next?: DiagnosisStepId) => {
    if (!visit) return;
    setSaving(true);
    try {
      const slim = { ...patch };
      if (slim.imaging?.images) {
        slim.imaging = {
          ...slim.imaging,
          images: slim.imaging.images.map(({ name }) => ({ name })),
        };
      }
      const merged = { ...visit, ...slim, currentStep: next ?? step };
      const updated = await patchDiagnosisVisit(visit.id, merged);
      setVisit((prev) => {
        if (!prev) return updated;
        if (patch.imaging?.images?.some((i) => i.dataUrl)) {
          return {
            ...updated,
            imaging: { ...updated.imaging, images: visit.imaging.images },
          };
        }
        if (patch.preconsult?.chatMessages) {
          return { ...updated, preconsult: { ...updated.preconsult, chatMessages: patch.preconsult.chatMessages } };
        }
        return updated;
      });
      if (next) setStep(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    const n = nextStep(step);
    if (!n || !visit) return;
    const completed = new Set(visit.completedSteps);
    completed.add(step);
    savePatch({ completedSteps: [...completed] }, n);
  };

  const goPrev = () => {
    const p = prevStep(step);
    if (p) setStep(p);
  };

  const handleNewVisit = async () => {
    const v = await createDiagnosisVisit();
    localStorage.setItem(DIAGNOSIS_VISIT_KEY, v.id);
    setVisit(v);
    setStep("registration");
    setError(null);
  };

  const handleImagingUpload = async (file: File) => {
    if (!visit) return;
    setImagingBusy(true);
    setError(null);
    try {
      if (isImagingZip(file)) {
        const img = await uploadVisitImaging(file);
        await savePatch({
          imaging: {
            uploaded: true,
            fileName: file.name,
            fileType: "zip",
            ...img,
          },
        });
      } else if (isImagingImage(file)) {
        const dataUrl = await readFileAsDataUrl(file);
        const prevImages = visit.imaging.images ?? [];
        const images = [...prevImages, { name: file.name, dataUrl }];
        await savePatch({
          imaging: {
            ...visit.imaging,
            uploaded: true,
            fileType: "image",
            fileName: images.length === 1 ? file.name : `${images.length} 张图片`,
            images,
            summary: `已上传 ${images.length} 张影像图片（JPG/PNG）`,
          },
        });
      } else {
        setError("请上传 .zip、.jpg、.jpeg 或 .png 文件");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "影像上传失败");
    } finally {
      setImagingBusy(false);
    }
  };

  const handleAiDiagnose = async () => {
    if (!visit) return;
    setAiBusy(true);
    setError(null);
    try {
      const { visit: updated } = await runAiDiagnosis(visit.id);
      setVisit(updated);
      setStep("ai_diagnosis");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 诊断失败");
    } finally {
      setAiBusy(false);
    }
  };

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-sm text-slate-400">加载就诊流程…</div>;
  }

  if (!visit) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-red-600">{error ?? "初始化失败"}</p>
        <button onClick={init} className="text-xs text-rose-600 underline">
          重试
        </button>
      </div>
    );
  }

  const stepIdx = DIAGNOSIS_STEPS.findIndex((s) => s.id === step);

  return (
    <div className={`flex flex-1 min-h-0 flex-col ${mobile ? "bg-slate-50" : "bg-[#f4f6f9]"}`}>
      <header className="shrink-0 border-b border-slate-200/80 bg-white px-6 py-5 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">临床诊断流程</h2>
            <p className="mt-1 text-sm text-slate-500">
              就诊号 <span className="font-mono text-slate-600">{visit.id.slice(0, 8)}…</span>
              <span className="mx-2 text-slate-300">|</span>
              与小程序数据同步
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!mobile && <MiniProgramQrButton />}
            <button
              onClick={handleNewVisit}
              className="rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
            >
              新建就诊
            </button>
          </div>
        </div>

        {/* 步骤条 — 宽松卡片式 */}
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {DIAGNOSIS_STEPS.map((s, i) => {
            const active = step === s.id;
            const done = visit.completedSteps.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`flex flex-col items-center rounded-2xl px-3 py-4 text-center transition ${
                  active
                    ? "bg-gradient-to-b from-rose-50 to-white shadow-md ring-2 ring-rose-200"
                    : done
                      ? "bg-violet-50/80 ring-1 ring-violet-100 hover:shadow-sm"
                      : "bg-slate-50 ring-1 ring-slate-100 hover:bg-white hover:shadow-sm"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    active
                      ? "bg-gradient-to-br from-rose-500 to-violet-600 text-white"
                      : done
                        ? "bg-violet-200 text-violet-800"
                        : "bg-white text-slate-500 ring-1 ring-slate-200"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`mt-2.5 text-xs font-medium leading-tight ${
                    active ? "text-rose-700" : done ? "text-violet-700" : "text-slate-600"
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {error && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">{error}</div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-8 sm:px-8">
        <div className={`mx-auto ${mobile ? "max-w-lg" : "max-w-3xl"}`}>
          <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-medium text-slate-800">
              步骤 {stepIdx + 1} / 6 · {DIAGNOSIS_STEPS[stepIdx]?.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">{DIAGNOSIS_STEPS[stepIdx]?.desc}</p>
          </div>

          {step === "registration" && (
            <StepRegistration
              visit={visit}
              onChange={(registration) => setVisit({ ...visit, registration })}
            />
          )}
          {step === "preconsult" && (
            <StepPreconsult
              visit={visit}
              onChange={(preconsult) => setVisit({ ...visit, preconsult })}
              onSaveChat={(preconsult) => savePatch({ preconsult })}
            />
          )}
          {step === "labs" && <StepLabs visit={visit} onChange={(labs) => setVisit({ ...visit, labs })} />}
          {step === "imaging" && (
            <StepImaging visit={visit} busy={imagingBusy} onUpload={handleImagingUpload} />
          )}
          {step === "guidelines" && (
            <StepGuidelines visit={visit} onChange={(guidelines) => setVisit({ ...visit, guidelines })} />
          )}
          {step === "ai_diagnosis" && (
            <StepAiDiagnosis visit={visit} busy={aiBusy} onRun={handleAiDiagnose} />
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
        <button
          onClick={goPrev}
          disabled={!prevStep(step)}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
        >
          上一步
        </button>
        <span className="text-xs text-slate-400">{saving ? "保存中…" : ""}</span>
        {step === "guidelines" ? (
          <button
            onClick={() => {
              goNext();
              handleAiDiagnose();
            }}
            disabled={aiBusy}
            className="rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            进入 AI 诊断
          </button>
        ) : step === "ai_diagnosis" ? (
          <button
            onClick={() => savePatch({})}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white"
          >
            保存并完成
          </button>
        ) : (
          <button
            onClick={() => {
              savePatch(
                {
                  registration: visit.registration,
                  preconsult: visit.preconsult,
                  labs: visit.labs,
                  guidelines: visit.guidelines,
                  imaging: visit.imaging,
                },
                nextStep(step) ?? step
              );
            }}
            className="rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 px-6 py-2.5 text-sm font-medium text-white"
          >
            下一步
          </button>
        )}
        </div>
      </footer>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100";

const cardCls = "space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8";

function StepRegistration({
  visit,
  onChange,
}: {
  visit: DiagnosisVisit;
  onChange: (r: DiagnosisVisit["registration"]) => void;
}) {
  const r = visit.registration;
  const set = (k: keyof typeof r, v: string | number) => onChange({ ...r, [k]: v });
  return (
    <div className={cardCls}>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="姓名">
          <input className={inputCls} value={r.patientName} onChange={(e) => set("patientName", e.target.value)} />
        </Field>
        <Field label="年龄">
          <input
            type="number"
            className={inputCls}
            value={r.age ?? ""}
            onChange={(e) => set("age", e.target.value ? Number(e.target.value) : "")}
          />
        </Field>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="性别">
          <select className={inputCls} value={r.gender} onChange={(e) => set("gender", e.target.value)}>
            <option>女</option>
            <option>男</option>
          </select>
        </Field>
        <Field label="联系电话">
          <input className={inputCls} value={r.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </Field>
      </div>
      <Field label="挂号科室">
        <input className={inputCls} value={r.department} onChange={(e) => set("department", e.target.value)} />
      </Field>
      <Field label="主诉">
        <textarea
          className={inputCls}
          rows={3}
          value={r.chiefComplaint}
          onChange={(e) => set("chiefComplaint", e.target.value)}
          placeholder="如下腹胀痛、CA125 升高…"
        />
      </Field>
    </div>
  );
}

function StepPreconsult({
  visit,
  onChange,
  onSaveChat,
}: {
  visit: DiagnosisVisit;
  onChange: (p: DiagnosisVisit["preconsult"]) => void;
  onSaveChat: (p: DiagnosisVisit["preconsult"]) => void;
}) {
  const p = visit.preconsult;
  const set = (k: keyof typeof p, v: string) => onChange({ ...p, [k]: v });
  const messages = (p.chatMessages ?? []) as ChatMessage[];

  return (
    <>
      <div className={cardCls}>
        <Field label="主要症状">
          <textarea className={inputCls} rows={3} value={p.symptoms} onChange={(e) => set("symptoms", e.target.value)} />
        </Field>
        <Field label="病程">
          <input className={inputCls} value={p.duration ?? ""} onChange={(e) => set("duration", e.target.value)} placeholder="如 2 月" />
        </Field>
        <Field label="既往史 / 手术史">
          <textarea className={inputCls} rows={2} value={p.history} onChange={(e) => set("history", e.target.value)} />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="过敏史">
            <input className={inputCls} value={p.allergies ?? ""} onChange={(e) => set("allergies", e.target.value)} />
          </Field>
          <Field label="当前用药">
            <input className={inputCls} value={p.medications ?? ""} onChange={(e) => set("medications", e.target.value)} />
          </Field>
        </div>
      </div>

      <PreconsultChat
        visit={visit}
        messages={messages}
        onMessagesChange={(m) => onChange({ ...p, chatMessages: m })}
        onPersist={(m) => onSaveChat({ ...p, chatMessages: m })}
        onSyncToForm={(text) => {
          onChange({
            ...p,
            chatMessages: messages,
            symptoms: p.symptoms ? `${p.symptoms}\n${text}` : text,
          });
          onSaveChat();
        }}
      />
    </>
  );
}

function StepLabs({
  visit,
  onChange,
}: {
  visit: DiagnosisVisit;
  onChange: (l: DiagnosisVisit["labs"]) => void;
}) {
  const labs = visit.labs;
  const setBlood = (k: string, v: string) =>
    onChange({ ...labs, blood: { ...labs.blood, [k]: v } });
  const setUrine = (k: string, v: string) =>
    onChange({ ...labs, urine: { ...labs.urine, [k]: v } });

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <p className="text-sm font-semibold text-slate-800">验血</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {DEFAULT_BLOOD_FIELDS.map((f) => (
            <Field key={f} label={f}>
              <input
                className={inputCls}
                value={labs.blood[f] ?? ""}
                onChange={(e) => setBlood(f, e.target.value)}
                placeholder="数值 + 单位"
              />
            </Field>
          ))}
        </div>
      </div>
      <div className={cardCls}>
        <p className="text-sm font-semibold text-slate-800">验尿</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {DEFAULT_URINE_FIELDS.map((f) => (
            <Field key={f} label={f}>
              <input
                className={inputCls}
                value={labs.urine[f] ?? ""}
                onChange={(e) => setUrine(f, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </div>
      <div className={cardCls}>
        <Field label="检验备注">
          <textarea
            className={inputCls}
            rows={2}
            value={labs.notes ?? ""}
            onChange={(e) => onChange({ ...labs, notes: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

function StepImaging({
  visit,
  busy,
  onUpload,
}: {
  visit: DiagnosisVisit;
  busy: boolean;
  onUpload: (f: File) => void;
}) {
  const img = visit.imaging;
  return (
    <div className={`${cardCls} space-y-6`}>
      <div>
        <p className="text-sm font-medium text-slate-800">上传影像资料</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          支持 <strong className="font-medium text-slate-700">DICOM .zip</strong> 压缩包（自动 PCI 分析），或
          <strong className="font-medium text-slate-700"> JPG / JPEG / PNG</strong> 报告截图（可多选逐张上传）
        </p>
      </div>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 transition hover:border-rose-300 hover:bg-rose-50/30">
        <p className="text-sm text-slate-600">{busy ? "处理中…" : "点击选择文件"}</p>
        <p className="mt-1 text-xs text-slate-400">.zip · .jpg · .jpeg · .png</p>
        <input
          type="file"
          accept=".zip,.jpg,.jpeg,.png,image/jpeg,image/png"
          disabled={busy}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </label>
      {busy && <p className="text-sm text-rose-600">影像分析中，请勿关闭…</p>}
      {img.uploaded && (
        <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900 ring-1 ring-violet-100">
          <p className="font-medium">已上传：{img.fileName}</p>
          {img.pciScore != null && <p className="mt-1">PCI {img.pciScore}</p>}
          {img.summary && <p className="mt-1 text-violet-800">{img.summary}</p>}
        </div>
      )}
      {img.images && img.images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {img.images.map((im, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {im.dataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={im.dataUrl} alt={im.name} className="aspect-square w-full object-cover" />
              )}
              <p className="truncate px-2 py-1.5 text-[10px] text-slate-500">{im.name}</p>
            </div>
          ))}
        </div>
      )}
      <Link href="/imaging" className="inline-block text-sm text-rose-600 hover:underline">
        打开完整 DICOM 标注模块 →
      </Link>
    </div>
  );
}

function StepGuidelines({
  visit,
  onChange,
}: {
  visit: DiagnosisVisit;
  onChange: (g: DiagnosisVisit["guidelines"]) => void;
}) {
  const g = visit.guidelines;
  const toggle = (item: string) => {
    const sel = new Set(g.selected);
    if (sel.has(item)) sel.delete(item);
    else sel.add(item);
    onChange({ ...g, selected: [...sel] });
  };
  return (
    <div className={cardCls}>
      <p className="text-sm font-semibold text-slate-800">选择参考指南</p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {GUIDELINE_OPTIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`rounded-full px-3 py-1.5 text-[11px] ${
              g.selected.includes(item)
                ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <Field label="指南应用备注">
        <textarea
          className={inputCls}
          rows={2}
          value={g.notes ?? ""}
          onChange={(e) => onChange({ ...g, notes: e.target.value })}
        />
      </Field>
      <Link href="/knowledge" className="inline-block text-sm text-rose-600 hover:underline">
        查看垂类知识库 →
      </Link>
    </div>
  );
}

function StepAiDiagnosis({
  visit,
  busy,
  onRun,
}: {
  visit: DiagnosisVisit;
  busy: boolean;
  onRun: () => void;
}) {
  const ai = visit.aiDiagnosis;
  return (
    <div className="space-y-6">
      {!ai ? (
        <div className={`${cardCls} text-center`}>
          <p className="text-sm text-slate-600">汇总前序步骤信息，生成 AI 辅助诊断</p>
          <button
            onClick={onRun}
            disabled={busy}
            className="mt-6 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "AI 分析中…" : "运行 AI 辅助诊断"}
          </button>
        </div>
      ) : (
        <>
          <div className={`${cardCls} border-rose-200 bg-gradient-to-r from-rose-50 to-violet-50`}>
            <p className="text-sm font-semibold text-slate-800">病情摘要</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{ai.summary}</p>
            <p className="mt-3 text-xs text-slate-500">
              紧急程度：{ai.urgency} · {ai.source === "llm" ? `大模型 ${ai.model ?? ""}` : "规则引擎"}
            </p>
          </div>
          <div className={cardCls}>
            <p className="text-sm font-semibold text-slate-800">鉴别诊断</p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
              {ai.differential.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div className={`${cardCls} border-amber-200 bg-amber-50`}>
            <p className="text-sm font-semibold text-amber-900">建议</p>
            <ul className="mt-3 space-y-1.5 text-sm text-amber-950">
              {ai.recommendations.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          </div>
          {ai.reasoning && (
            <div className={`${cardCls} border-violet-200 bg-violet-50/60 text-sm text-violet-950`}>
              {ai.reasoning}
            </div>
          )}
          <button
            onClick={onRun}
            disabled={busy}
            className="text-xs text-slate-500 underline disabled:opacity-50"
          >
            重新分析
          </button>
        </>
      )}
      <p className="text-center text-xs text-slate-400">仅供临床参考，不能替代医生面诊与签字。</p>
    </div>
  );
}
