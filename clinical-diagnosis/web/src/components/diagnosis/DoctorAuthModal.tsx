"use client";

import { useEffect, useState } from "react";
import { IconClose } from "@/components/IconFont";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { DEPARTMENTS, DOCTOR_TITLES } from "@/lib/auth-types";

type Mode = "login" | "register";

export function DoctorAuthModal() {
  const { showAuthModal, authModalMode, closeAuthModal, login, register } = useDiagnosis();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    department: DEPARTMENTS[0],
    title: DOCTOR_TITLES[1],
  });

  useEffect(() => {
    if (showAuthModal) setMode(authModalMode);
  }, [showAuthModal, authModalMode]);

  if (!showAuthModal) return null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {mode === "login" ? "医生登录" : "医生注册"}
          </h3>
          <button
            type="button"
            onClick={closeAuthModal}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭"
          >
            <IconClose size={16} color="currentColor" />
          </button>
        </div>

        <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === m ? "bg-white text-rose-700 shadow-sm" : "text-slate-500"
              }`}
            >
              {m === "login" ? "登录" : "注册"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === "register" && (
            <>
              <input
                className="input-field"
                placeholder="姓名"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
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
                <select
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                >
                  {DOCTOR_TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <input
            className="input-field"
            type="email"
            placeholder="工作邮箱"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="input-field"
            type="password"
            placeholder="密码（至少 6 位）"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "请稍候…" : mode === "login" ? "登录" : "注册并进入"}
        </button>
      </div>
    </div>
  );
}
