"use client";

import { useCallback, useEffect, useState } from "react";
import { useDiagnosis } from "@/context/DiagnosisContext";
import {
  createDiagnosisVisit,
  doctorNextStep,
  doctorPrevStep,
  fetchDiagnosisVisit,
  isDoctorStepDone,
  isImagingDicom,
  isImagingImage,
  isImagingZip,
  normalizeDoctorStep,
  patchDiagnosisVisit,
  readFileAsDataUrl,
  runAiDiagnosis,
  uploadVisitImaging,
} from "@/lib/diagnosis-api";
import {
  DEFAULT_BLOOD_FIELDS,
  DEFAULT_URINE_FIELDS,
  DOCTOR_DIAGNOSIS_STEPS,
  DIAGNOSIS_VISIT_KEY,
  GUIDELINE_OPTIONS,
  type DiagnosisStepId,
  type DiagnosisVisit,
} from "@/lib/diagnosis-types";

type Props = {
  mobile?: boolean;
  onRegisterNewVisit?: (fn: () => void) => void;
};

export function ClinicalDiagnosisView({ mobile, onRegisterNewVisit }: Props) {
  const { doctor, selectedPatient, registerVisitControl, bindCurrentVisit } = useDiagnosis();
  const [visit, setVisit] = useState<DiagnosisVisit | null>(null);
  const [step, setStep] = useState<DiagnosisStepId>("structured_record");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagingBusy, setImagingBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  const loadVisit = useCallback(async (visitId: string) => {
    setLoading(true);
    setError(null);
    try {
      const v = await fetchDiagnosisVisit(visitId);
      localStorage.setItem(DIAGNOSIS_VISIT_KEY, v.id);
      setVisit(v);
      setStep(normalizeDoctorStep(v.currentStep ?? "structured_record"));
    } catch {
      setError("加载就诊记录失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const newVisit = useCallback(
    async (patientId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const v = await createDiagnosisVisit({
          patientId: patientId ?? selectedPatient?.id,
          department: doctor?.department,
        });
        localStorage.setItem(DIAGNOSIS_VISIT_KEY, v.id);
        setVisit(v);
        setStep("structured_record");
      } catch {
        setError("无法连接后端，请启动 backend :8001");
      } finally {
        setLoading(false);
      }
    },
    [doctor?.department, selectedPatient?.id]
  );

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const savedId = localStorage.getItem(DIAGNOSIS_VISIT_KEY);
      if (savedId) {
        try {
          await loadVisit(savedId);
          return;
        } catch {
          localStorage.removeItem(DIAGNOSIS_VISIT_KEY);
        }
      }
      await newVisit();
    } catch {
      setError("无法连接后端，请启动 backend :8001");
      setLoading(false);
    }
  }, [loadVisit, newVisit]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    registerVisitControl({ loadVisit, newVisit });
    return () => registerVisitControl(null);
  }, [loadVisit, newVisit, registerVisitControl]);

  useEffect(() => {
    if (!visit?.id || !selectedPatient || visit.patientId) return;
    bindCurrentVisit(visit.id).catch(() => {});
  }, [visit?.id, visit?.patientId, selectedPatient, bindCurrentVisit]);

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
    const n = doctorNextStep(step);
    if (!n || !visit) return;
    const completed = new Set(visit.completedSteps);
    completed.add(normalizeDoctorStep(step));
    savePatch({ completedSteps: [...completed] }, n);
  };

  const goPrev = () => {
    const p = doctorPrevStep(step);
    if (p) setStep(p);
  };

  const handleNewVisit = useCallback(async () => {
    await newVisit(selectedPatient?.id);
    setError(null);
  }, [newVisit, selectedPatient?.id]);

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

  useEffect(() => {
    onRegisterNewVisit?.(handleNewVisit);
  }, [onRegisterNewVisit, handleNewVisit]);

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

  const stepIdx = DOCTOR_DIAGNOSIS_STEPS.findIndex((s) => s.id === normalizeDoctorStep(step));
  const displayStep = normalizeDoctorStep(step);

  return (
    <div className={`flex flex-1 min-h-0 flex-col ${mobile ? "bg-slate-50" : "bg-[#f4f6f9]"}`}>
      <header className="shrink-0 border-b border-slate-200/80 bg-white px-6 py-5 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">AI 辅助诊断</h2>
          <p className="mt-1 text-sm text-slate-500">
            {selectedPatient ? (
              <>
                患者 <span className="font-medium text-slate-700">{selectedPatient.name}</span>
                <span className="mx-2 text-slate-300">|</span>
              </>
            ) : null}
            就诊号 <span className="font-mono text-slate-600">{visit.id.slice(0, 8)}…</span>
            {doctor ? (
              <>
                <span className="mx-2 text-slate-300">|</span>
                {doctor.department}
              </>
            ) : null}
          </p>

          {/* 步骤条 — 宽松卡片式 */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {DOCTOR_DIAGNOSIS_STEPS.map((s, i) => {
              const active = displayStep === s.id;
              const done = isDoctorStepDone(visit, s.id);
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
                        : "bg-slate-50 ring-1 ring-slate-200 hover:bg-white hover:shadow-sm"
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
        </div>
      </header>

      {error && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">{error}</div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-8 sm:px-8">
        <div className={`mx-auto ${mobile ? "max-w-lg" : "max-w-3xl"}`}>
          <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-medium text-slate-800">
              步骤 {stepIdx + 1} / {DOCTOR_DIAGNOSIS_STEPS.length} · {DOCTOR_DIAGNOSIS_STEPS[stepIdx]?.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">{DOCTOR_DIAGNOSIS_STEPS[stepIdx]?.desc}</p>
          </div>

          {displayStep === "structured_record" && <StepStructuredRecord visit={visit} />}
          {displayStep === "labs" && <StepLabs visit={visit} onChange={(labs) => setVisit({ ...visit, labs })} />}
          {displayStep === "imaging" && (
            <StepImaging visit={visit} busy={imagingBusy} onUpload={handleImagingUpload} />
          )}
          {displayStep === "guidelines" && (
            <StepGuidelines visit={visit} onChange={(guidelines) => setVisit({ ...visit, guidelines })} />
          )}
          {displayStep === "ai_diagnosis" && (
            <StepAiDiagnosis visit={visit} busy={aiBusy} onRun={handleAiDiagnose} />
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
        <button
          onClick={goPrev}
          disabled={!doctorPrevStep(step)}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
        >
          上一步
        </button>
        <span className="text-xs text-slate-400">{saving ? "保存中…" : ""}</span>
        {displayStep === "guidelines" ? (
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
        ) : displayStep === "ai_diagnosis" ? (
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
                  labs: visit.labs,
                  guidelines: visit.guidelines,
                  imaging: visit.imaging,
                },
                doctorNextStep(step) ?? step
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

function ReadOnlyField({ label, value }: { label: string; value?: string | number | null }) {
  const text = value === undefined || value === null || value === "" ? "—" : String(value);
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function StepStructuredRecord({ visit }: { visit: DiagnosisVisit }) {
  const r = visit.registration;
  const p = visit.preconsult;
  const messages = p.chatMessages ?? [];
  const hasData = Boolean(
    r.patientName || r.chiefComplaint || p.symptoms || p.history || p.duration || messages.length > 0
  );

  if (!hasData) {
    return (
      <div className={`${cardCls} text-center`}>
        <p className="text-sm font-medium text-slate-700">暂无结构化病例</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          请等待患者在小程序端完成挂号与预问诊，完成后将自动生成结构化病例供您查阅。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <p className="text-sm font-semibold text-slate-800">基本信息</p>
        <p className="mt-1 text-xs text-slate-500">来自患者挂号，医生端只读</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <ReadOnlyField label="姓名" value={r.patientName} />
          <ReadOnlyField label="年龄" value={r.age} />
          <ReadOnlyField label="性别" value={r.gender} />
          <ReadOnlyField label="联系电话" value={r.phone} />
          <ReadOnlyField label="挂号科室" value={r.department} />
          <ReadOnlyField label="就诊号" value={r.visitNo} />
        </div>
        <div className="mt-5">
          <ReadOnlyField label="主诉" value={r.chiefComplaint} />
        </div>
      </div>

      <div className={cardCls}>
        <p className="text-sm font-semibold text-slate-800">预问诊结构化病例</p>
        <p className="mt-1 text-xs text-slate-500">由患者预问诊对话自动整理</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <ReadOnlyField label="主要症状" value={p.symptoms} />
          <ReadOnlyField label="病程" value={p.duration} />
        </div>
        <div className="mt-5 grid gap-5">
          <ReadOnlyField label="既往史 / 手术史" value={p.history} />
          <div className="grid gap-5 sm:grid-cols-2">
            <ReadOnlyField label="过敏史" value={p.allergies} />
            <ReadOnlyField label="当前用药" value={p.medications} />
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className={cardCls}>
          <p className="text-sm font-semibold text-slate-800">预问诊对话记录</p>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto scrollbar-thin">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-8 bg-slate-100 text-slate-800"
                    : "mr-8 bg-rose-50 text-rose-950"
                }`}
              >
                <p className="mb-1 text-[10px] font-medium text-slate-400">
                  {m.role === "user" ? "患者" : "预问诊助手"}
                </p>
                {m.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
          支持 <strong className="font-medium text-slate-700">JPG / JPEG / PNG</strong> 报告截图（可多选逐张上传），或
          <strong className="font-medium text-slate-700"> .zip</strong> 压缩包（仅存档，不解析 DICOM）
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
