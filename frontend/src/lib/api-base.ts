/** API 基址：浏览器走 Next 同源代理，避免 CORS / localhost vs 127.0.0.1 问题 */

export function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  // 浏览器端默认走相对路径（next.config rewrites 代理到 backend）
  if (typeof window !== "undefined") {
    return env && env.length > 0 ? env.replace(/\/$/, "") : "";
  }
  return (env ?? "http://127.0.0.1:8000").replace(/\/$/, "");
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/v1/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
