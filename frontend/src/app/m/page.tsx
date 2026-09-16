export default function MobileHome() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-lg font-semibold text-slate-900">MedNexus 临床诊断</p>
      <p className="text-sm text-slate-500">手机版 / 微信小程序同步入口</p>
      <a
        href="/m/diagnosis"
        className="rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 px-8 py-3 text-sm font-medium text-white"
      >
        开始就诊流程
      </a>
    </div>
  );
}
