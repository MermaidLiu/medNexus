"""Gynecologic oncology vertical — topics, templates, and navigator content."""

from __future__ import annotations

DISEASE_AREAS = [
    {
        "id": "ovarian",
        "name": "卵巢癌",
        "icon": "ovarian",
        "topics": ["PARP抑制剂", "HRD检测", "铂耐药", "维持治疗", "贝伐珠单抗"],
    },
    {
        "id": "cervical",
        "name": "宫颈癌",
        "icon": "cervical",
        "topics": ["免疫检查点抑制剂", "PD-L1 CPS", "同步放化疗", "复发转移"],
    },
    {
        "id": "endometrial",
        "name": "子宫内膜癌",
        "icon": "endometrial",
        "topics": ["MSI-H/dMMR", "免疫治疗", "分子分型", "Lynch综合征"],
    },
    {
        "id": "gestational",
        "name": "妊娠滋养细胞肿瘤",
        "icon": "gestational",
        "topics": ["GTN", "低危/high-risk", "EMA/CO方案"],
    },
]

SUGGESTED_QUESTIONS = [
    "铂敏感复发卵巢癌患者中，PARP抑制剂维持治疗 vs 安慰剂，PFS 和 OS 获益如何？",
    "HRD阳性 vs BRCA突变阴性卵巢癌，奥拉帕利疗效是否存在差异？",
    "晚期宫颈癌一线 PD-1 抑制剂联合化疗，CPS≥1 亚组的 OS 获益？",
    "dMMR/MSI-H 晚期子宫内膜癌，帕博利珠单抗 vs 化疗的 ORR 和 DoR？",
    "新辅助化疗后中间型减瘤术 vs 先期减瘤术，III-IV期高级别浆液性卵巢癌 PFS 比较？",
    "贝伐珠单抗联合 PARP 抑制剂维持治疗铂敏感复发卵巢癌，PFS 是否优于 PARP 单药？",
]

READ_COMPUTE_DO = [
    {
        "id": "read",
        "title": "读 · 文献导航",
        "subtitle": "1.6亿级文献智能检索",
        "description": "自动解析科研意图，匹配 NCCN/ESMO/关键 RCT 与真实世界证据，一键溯源原文。",
        "steps": ["Research Question", "Literature Search", "Literature Comparison"],
    },
    {
        "id": "compute",
        "title": "算 · 临床分析",
        "subtitle": "OMOP 队列 + 生存分析",
        "description": "队列定义、数据抽取与清洗，PSM/Cox 回归、亚组 Forest Plot、KM 曲线。",
        "steps": ["Cohort Definition", "Data Extraction", "Data Cleaning", "Statistical Analysis", "Visualization"],
    },
    {
        "id": "do",
        "title": "做 · 科研产出",
        "subtitle": "报告 · 综述 · 决策支持",
        "description": "整合文献证据与实证结果，生成结构化研究报告，支持主任审批与迭代。",
        "steps": ["Research Report"],
    },
]

FEATURED_TRIALS = [
    {
        "name": "SOLO-1",
        "disease": "卵巢癌",
        "finding": "奥拉帕利维持治疗 HR 0.59 (PFS)，BRCA突变一线维持",
    },
    {
        "name": "KEYNOTE-826",
        "disease": "宫颈癌",
        "finding": "帕博利珠单抗+化疗 HR 0.64 (OS)，PD-L1 CPS≥1",
    },
    {
        "name": "NRG-GY018",
        "disease": "子宫内膜癌",
        "finding": "帕博利珠单抗+化疗 dMMR 组 HR 0.36 (PFS)",
    },
    {
        "name": "PAOLA-1",
        "disease": "卵巢癌",
        "finding": "奥拉帕利+贝伐珠单抗 HR 0.59 (PFS)，HRD阳性人群",
    },
]

APP_TOOLS = [
    {"name": "PICO 结构化", "category": "读", "desc": "自然语言 → PICO + 研究设计"},
    {"name": "Evidence Table", "category": "读", "desc": "关键 RCT/RWE 证据汇总"},
    {"name": "OMOP 队列构建", "category": "算", "desc": "纳入/排除 + Concept Set"},
    {"name": "Cox/PSM 分析", "category": "算", "desc": "生存分析 + 倾向评分匹配"},
    {"name": "KM / Forest Plot", "category": "算", "desc": "可视化图表自动生成"},
    {"name": "Research Report", "category": "做", "desc": "Markdown 结构化报告"},
]
