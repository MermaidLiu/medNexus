"use client";

import { useState } from "react";
import { IconClose } from "@/components/IconFont";
import { DEPARTMENTS } from "@/lib/auth-types";
import { useDiagnosis } from "@/context/DiagnosisContext";

export function AddPatientModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { doctor, addPatient } = useDiagnosis();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    gender: "女",
    age: "",
    phone: "",
    department: doctor?.department ?? DEPARTMENTS[0],
  });

  if (!open) return null;

  const submit = async () => {
    if (!form.name.trim()) {
      setError("请输入患者姓名");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addPatient({
        name: form.name.trim(),
        gender: form.gender,
        age: form.age ? Number(form.age) : undefined,
        phone: form.phone,
        department: form.department,
      });
      onClose();
      setForm({
        name: "",
        gender: "女",
        age: "",
        phone: "",
        department: doctor?.department ?? DEPARTMENTS[0],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "添加失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">添加患者</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭"
          >
            <IconClose size={16} color="currentColor" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            className="input-field"
            placeholder="患者姓名 *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="input-field"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="女">女</option>
              <option value="男">男</option>
            </select>
            <input
              className="input-field"
              type="number"
              placeholder="年龄"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </div>
          <input
            className="input-field"
            placeholder="联系电话"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <select
            className="input-field"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "添加中…" : "添加并新建就诊"}
        </button>
      </div>
    </div>
  );
}
