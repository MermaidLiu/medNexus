# MedNexus GynOnc Science Navigator

**妇科肿瘤 AI4S 垂类平台** — 模仿 [玻尔科学导航 (Bohrium Science Navigator)](https://www.bohrium.com/intro) 的「读 · 算 · 做」架构，聚焦妇科肿瘤领域。

## 产品架构（对标玻尔）

| 玻尔能力 | MedNexus GynOnc |
|---------|-----------------|
| 科学导航搜索 | `/` 首页 — 自然语言提问 → 文献 + PICO + 证据 |
| 读文献 | Research Question + Literature Search + Comparison |
| 做计算 | Cohort → Extraction → Cleaning → Stats → Visualization |
| 做产出 | Research Report（含 Table 1 + HR） |
| Apps 工具商店 | 6 个垂类工具（PICO / OMOP / Cox / KM 等） |
| 垂类数据库 | 卵巢癌 / 宫颈癌 / 子宫内膜癌 / GTN |

## 页面结构（对标玻尔）

```
┌─────────────┬──────────────────────────────────┐
│  左侧导航    │  TopBar（当前模块标题）            │
│             ├──────────────────────────────────┤
│ 🧭 科学导航  │                                  │
│ 🔬 深度研究  │         主工作区                  │
│ 📚 读·文献   │                                  │
│ 📊 算·分析   │                                  │
│ 📝 做·产出   │                                  │
│ 🧩 Apps     │                                  │
│ 🎗️ 知识库   │                                  │
│ 我的研究 ▼  │                                  │
└─────────────┴──────────────────────────────────┘
```

| 路由 | 模块 |
|------|------|
| `/` | 科学导航 — 搜索提问 |
| `/research` | 深度研究 — 9 步流水线 |
| `/read` | 读 · 文献（PICO/检索/对比） |
| `/compute` | 算 · 分析（队列→统计→图表） |
| `/produce` | 做 · 产出（研究报告） |
| `/apps` | Apps 工具库 |
| `/knowledge` | 垂类知识库 |

## 快速启动

```bash
# 后端
cd backend && uvicorn app.main:app --reload --port 8000

# 前端
cd frontend && bash scripts/install.sh && npm run dev
```

## API

- `GET /api/v1/navigator/config` — 垂类配置（病种、示例问题、读算做）
- `POST /api/v1/navigator/search` — 快速文献导航搜索
- `POST /api/v1/studies` + `/run` — 完整 9 步流水线

## 垂类内容

- **PICO 模板**：PARP 抑制剂、PD-1 免疫、贝伐珠单抗、含铂化疗
- **文献库**：SOLO-1、PAOLA-1、KEYNOTE-826、NRG-GY018、NOVA
- **终点**：PFS、OS、ORR、DoR（替代 MACE 等心血管终点）

## 下一步

- 接入真实妇科肿瘤文献 API / PubMed
- 对接医院 OMOP 妇科肿瘤队列
- 指南知识库（NCCN/ESMO/CSCO）
- 学术配图 / 机制图生成
