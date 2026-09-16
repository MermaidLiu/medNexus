"""临床诊断 AI 辅助."""

from __future__ import annotations

import json
from typing import Any

from app.config import settings

SYSTEM_PROMPT = """你是妇科肿瘤临床诊断助手。根据挂号、预问诊、生化检验、影像与指南参考信息，输出 JSON：
{
  "summary": "2-3句病情摘要",
  "differential": ["鉴别诊断1", "鉴别诊断2", "..."],
  "recommendations": ["建议检查/处理1", "..."],
  "urgency": "常规随访|尽快门诊|建议急诊",
  "guidelineRefs": ["相关指南要点"],
  "reasoning": "3-5句推理过程"
}
注意：仅供临床参考，不能替代面诊。"""


def _build_prompt(visit: dict[str, Any]) -> str:
    reg = visit.get("registration") or {}
    pre = visit.get("preconsult") or {}
    labs = visit.get("labs") or {}
    img = visit.get("imaging") or {}
    guide = visit.get("guidelines") or {}

    blood = labs.get("blood") or {}
    urine = labs.get("urine") or {}
    chat = pre.get("chatMessages") or []
    chat_summary = "；".join(
        m.get("content", "") for m in chat if m.get("role") == "user"
    )[:500]

    return "\n".join(
        [
            "## 挂号",
            f"姓名: {reg.get('patientName')} 年龄: {reg.get('age', '—')} 性别: {reg.get('gender')}",
            f"科室: {reg.get('department')} 主诉: {reg.get('chiefComplaint')}",
            "",
            "## 预问诊",
            f"症状: {pre.get('symptoms')}",
            f"病程: {pre.get('duration', '—')}",
            f"既往史: {pre.get('history')}",
            f"过敏/用药: {pre.get('allergies', '—')} / {pre.get('medications', '—')}",
            f"智能对话摘要: {chat_summary or '—'}",
            "",
            "## 生化分析",
            f"血液: {json.dumps(blood, ensure_ascii=False) if blood else '未录入'}",
            f"尿液: {json.dumps(urine, ensure_ascii=False) if urine else '未录入'}",
            f"备注: {labs.get('notes', '—')}",
            "",
            "## 影像",
            f"已上传: {img.get('uploaded')}",
            f"文件: {img.get('fileName', '—')}",
            f"摘要: {img.get('summary', '—')}",
            "",
            "## 参考指南",
            f"已选: {', '.join(guide.get('selected') or []) or '—'}",
            "",
            "请给出 AI 辅助诊断意见。",
        ]
    )


def ai_diagnose(visit: dict[str, Any]) -> dict[str, Any]:
    fallback = {
        "summary": "已完成多步信息采集，建议结合门诊查体与影像科报告综合判断。",
        "differential": ["上皮性卵巢癌待排", "良性卵巢肿瘤", "盆腔炎性疾病"],
        "recommendations": [
            "完善 CA125、HE4 及盆腔 MRI/CT",
            "妇科肿瘤 MDT 讨论",
            "参考 NCCN 卵巢癌诊疗指南",
        ],
        "urgency": "尽快门诊",
        "guidelineRefs": ["NCCN 卵巢癌", "ESMO 妇科肿瘤"],
        "reasoning": "基于主诉与检验/影像信息的规则模板（LLM 未配置或调用失败）。",
        "source": "rules",
    }

    if not settings.openai_api_key:
        return fallback

    try:
        from app.llm import get_llm_client

        client = get_llm_client()
        res = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_prompt(visit)},
            ],
            response_format={"type": "json_object"},
            temperature=0.25,
            max_tokens=1200,
        )
        content = res.choices[0].message.content or "{}"
        data = json.loads(content)
        return {
            "summary": str(data.get("summary", fallback["summary"])),
            "differential": list(data.get("differential") or fallback["differential"])[:6],
            "recommendations": list(data.get("recommendations") or fallback["recommendations"])[:8],
            "urgency": str(data.get("urgency", fallback["urgency"])),
            "guidelineRefs": list(data.get("guidelineRefs") or [])[:5],
            "reasoning": str(data.get("reasoning", "")),
            "source": "llm",
            "model": settings.openai_model,
        }
    except Exception:
        return fallback
