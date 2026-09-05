import { NextRequest, NextResponse } from "next/server";
import {
  buildGenomicsUserPrompt,
  parseLlmInterpretation,
  rulesFallback,
  SYSTEM_PROMPT,
} from "@/lib/genomics-llm";
import type { GenomicsCase } from "@/lib/genomics-types";

export const runtime = "nodejs";
export const maxDuration = 120;

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
  let caseData: GenomicsCase;
  try {
    caseData = (await req.json()) as GenomicsCase;
  } catch {
    return NextResponse.json({ detail: "无效请求体" }, { status: 400 });
  }

  const ruleFallback = rulesFallback(caseData);

  const { apiKey, baseUrl, model } = llmConfig();
  if (!apiKey) {
    return NextResponse.json({
      ...ruleFallback,
      warning: "未配置 LLM_API_KEY，已使用规则引擎",
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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildGenomicsUserPrompt(caseData) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.25,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) {
      return NextResponse.json({
        ...ruleFallback,
        warning: `大模型暂不可用 (${res.status})，已回退规则引擎`,
      });
    }

    const payload = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({
        ...ruleFallback,
        warning: "大模型返回为空，已回退规则引擎",
      });
    }

    const interpretation = parseLlmInterpretation(content, ruleFallback);
    return NextResponse.json({ ...interpretation, model });
  } catch {
    return NextResponse.json({
      ...ruleFallback,
      warning: "大模型请求失败，已回退规则引擎",
    });
  }
}
