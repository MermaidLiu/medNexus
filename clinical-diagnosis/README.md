# Clinical Diagnosis MVP

**AI 辅助临床诊断** — 从 MedNexus 拆分的独立最小验证产品，可单独绑定域名给院方试用。

## 功能

| 步骤 | 说明 |
|------|------|
| 医生登录 | 注册 / 登录，选择所属科室 |
| 患者管理 | 左侧栏添加并绑定患者，切换历史就诊 |
| 挂号 | 基本信息与主诉（科室下拉） |
| 预问诊 | 病史表单 + **智能对话**（LLM） |
| 生化分析 | 验血 / 验尿 |
| 影像上传 | JPG / PNG 截图；ZIP 存档（MVP 不解析 DICOM） |
| 参考指南 | NCCN / ESMO 等 |
| AI 辅助诊断 | 综合前序信息生成建议 |

Web 与微信小程序共用同一后端 API，就诊数据保存在 `data/diagnosis/visits.json`。

## 目录结构

```
clinical-diagnosis/
├── backend/          # FastAPI — 就诊 CRUD + AI 诊断
├── web/              # Next.js — 独立 Web（无 MedNexus 导航壳）
├── miniprogram/      # 微信小程序
├── data/diagnosis/   # 就诊持久化（生产环境 volume 挂载）
├── docker-compose.yml
└── scripts/dev.sh
```

## 快速启动（本地）

```bash
cd clinical-diagnosis

# 1. 配置环境变量
cp backend/.env.example backend/.env
cp .env.example web/.env.local
# 填入 OPENAI_API_KEY / LLM_API_KEY

# 2. 后端（端口 8001，避免与 MedNexus 8000 冲突）
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# 3. 前端（端口 3001）
cd ../web
npm install
npm run dev
# 打开 http://localhost:3001/diagnosis
```

或使用一键脚本：

```bash
bash scripts/dev.sh
```

## Docker 部署

```bash
cp .env.example .env   # 填入密钥
docker compose up --build
# Web: http://localhost:3001/diagnosis
# API: http://localhost:8001/docs
```

## 院方独立域名部署

| 服务 | 建议域名 | 说明 |
|------|---------|------|
| Web | `diagnosis.hospital.com` | Next.js standalone |
| API | `api.diagnosis.hospital.com` | FastAPI + CORS 白名单 |
| 小程序 | — | `miniprogram/config.js` 中 `API_BASE` 指向 API 域名 |

### 环境变量

**backend/.env**

```
CORS_ORIGINS=https://diagnosis.hospital.com
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=http://118.195.160.99/v1
OPENAI_MODEL=gemini-2.5-flash
DATA_ROOT=/data   # Docker 挂载
```

**web/.env.local**

```
BACKEND_URL=https://api.diagnosis.hospital.com
LLM_API_KEY=sk-...
LLM_BASE_URL=http://118.195.160.99/v1
LLM_MODEL=gemini-2.5-flash
```

## 与 MedNexus 大平台的关系

MedNexus 左侧导航「AI 辅助诊断流程」可改为外链跳转：

```
https://diagnosis.hospital.com/diagnosis
```

大平台继续保留科研导航、NACT 预测、影像 PCI 等模块；本 MVP 不依赖 MedNexus 任何前端组件。

## 小程序

1. 用微信开发者工具打开 `miniprogram/`
2. 修改 `config.js` 中 `API_BASE` 为 HTTPS 后端地址
3. 在微信公众平台配置 request 合法域名

## API 文档

启动后端后访问：`http://localhost:8001/docs`

核心接口：

- `POST /api/v1/diagnosis/visits` — 创建就诊
- `PATCH /api/v1/diagnosis/visits/{id}` — 保存步骤
- `POST /api/v1/diagnosis/visits/{id}/ai-diagnose` — AI 诊断

预问诊对话由 Next.js BFF 处理：`POST /api/v1/diagnosis/preconsult-chat`

## 后续扩展

- [ ] 接入 DICOM ZIP + PCI 影像分析
- [ ] Postgres 替代 JSON 文件存储
- [ ] 院方 SSO / 登录鉴权
- [ ] 审计日志与多租户
