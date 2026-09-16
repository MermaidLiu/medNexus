import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM = `你是 MedNexus 妇科肿瘤预问诊助手。用简洁、专业的中文与患者对话，收集：
- 主要症状与持续时间
- 月经/生育史（如相关）
- 既往肿瘤/手术/化疗史
- 家族史
每次回复 2-4 句，必要时提 1-2 个追问。不要诊断定论，最后可提示「请携带资料到科室面诊」。`;

function llmConfig() {
  return {
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
    baseUrl: (process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || "http://118.195.160.99/v1").replace(
      /\/$/,
      ""
    ),
    model: process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gemini-2.5-flash",
  };
}

export async function POST(req: NextRequest) {
  let body: {
    messages?: { role: string; content: string }[];
    context?: { chiefComplaint?: string; patientName?: string; age?: number };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "无效请求" }, { status: 400 });
  }

  const history = body.messages ?? [];
  const ctx = body.context ?? {};
  const { apiKey, baseUrl, model } = llmConfig();

  const contextLine = [
    ctx.patientName && `患者：${ctx.patientName}`,
    ctx.age && `年龄：${ctx.age}`,
    ctx.chiefComplaint && `主诉：${ctx.chiefComplaint}`,
  ]
    .filter(Boolean)
    .join(" · ");

  if (!apiKey) {
    const last = history.filter((m) => m.role === "user").pop()?.content ?? "";
    return NextResponse.json({
      reply: `（演示模式）已了解您的情况：「${last.slice(0, 80)}」。请补充症状持续时间、既往检查（如 CA125、超声），以便医生面诊参考。`,
      source: "demo",
    });
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM + (contextLine ? `\n\n已知：${contextLine}` : "") },
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) {
      return NextResponse.json({ detail: "大模型暂不可用" }, { status: 502 });
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "请继续描述您的症状。";
    return NextResponse.json({ reply, source: "llm", model });
  } catch {
    return NextResponse.json({ detail: "对话请求失败" }, { status: 500 });
  }
}
