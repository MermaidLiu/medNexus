"use client";

import { useMemo, useState } from "react";

const STATIC_QR = "/miniprogram-qr.png";

/** 悬停展示小程序 / 手机版二维码 */
export function MiniProgramQrButton() {
  const [open, setOpen] = useState(false);
  const [useStatic, setUseStatic] = useState(true);

  const mobileUrl = useMemo(() => {
    if (typeof window === "undefined") return "/m/diagnosis";
    return `${window.location.origin}/m/diagnosis`;
  }, []);

  const generatedQrSrc = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(mobileUrl)}`;
  }, [mobileUrl]);

  const qrSrc = useStatic ? STATIC_QR : generatedQrSrc;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-rose-200 hover:text-rose-700"
      >
        手机版 ↗
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <p className="text-center text-xs font-semibold text-slate-800">微信扫码</p>
          <p className="mt-1 text-center text-[10px] text-slate-500">小程序 · 与 Web 数据同步</p>
          <div className="mx-auto mt-3 flex h-[200px] w-[200px] items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="小程序二维码"
              width={200}
              height={200}
              className="h-full w-full object-contain"
              onError={() => setUseStatic(false)}
            />
          </div>
          {!useStatic && (
            <p className="mt-3 break-all text-center text-[9px] leading-relaxed text-slate-400">{mobileUrl}</p>
          )}
          {useStatic && (
            <p className="mt-3 text-center text-[9px] text-slate-400">
              可将真实小程序码放到 <code className="text-slate-500">public/miniprogram-qr.png</code>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
