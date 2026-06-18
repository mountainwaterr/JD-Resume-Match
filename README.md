# AI简历助手 — 诚实地了解自己，比美化简历更重要

> 上传简历 + 粘贴JD → AI 给你一份不粉饰的 6 维度匹配度报告 → 看清你离目标岗位的真实距离

## 这是什么？

大多数简历工具帮你"美化"简历。这个工具不一样——它先诚实地告诉你**差在哪里**。

粘贴一份职位描述（JD），AI 会从 6 个维度给你的简历打分：技能匹配、经验年限、学历、语言能力、项目经历、综合推荐度。你会得到一份"匹配度体检报告"，而不是一份粉饰过的简历。

**核心差异**：先体检，再对症下药。不是假装你什么都会，而是让你看清该补什么。

**免登录即可使用**核心的简历匹配功能，数据不留存。

## 功能

| 功能 | 说明 |
|------|------|
| **简历匹配分析** | 上传简历 + 粘贴JD → 6维度评分（技能/经验/教育/语言/项目/综合）→ 差距报告 + 改进建议 |
| **JD翻译官** | 把JD里的企业黑话翻译成人话技能清单 |
| **AI简历润色** | 智能识别薄弱条目 → STAR法则引导 → AI重写专业表达，不编造经历 |
| **简历管理** | 上传PDF/DOCX、可视化编辑、多版本管理 |
| **JD批量分析** | 批量上传多份JD → 提取技能分类（必备/加分/软技能）→ 学习路径 + GitHub项目推荐 |
| **求职信生成** | AI根据简历+JD自动生成定制化求职信和打招呼消息 |
| **AI聊天助手** | 简历/求职相关问题对话 |
| **4套简历模板** | 瑞士单栏/双栏、现代单栏/双栏，实时预览，PDF导出 |
| **多语言** | UI支持中文/英文/日文/西班牙文，AI自动检测语言输出对应语种 |
| **用户系统** | 邮箱注册/登录（Better Auth），简历数据按用户隔离 |

## 技术栈

| 层 | 技术 |
|----|------|
| AI引擎 | LiteLLM（默认DeepSeek，支持OpenAI/Anthropic/Ollama等灵活切换） |
| 后端 | FastAPI + Python 3.13+ |
| 前端 | Next.js 16 + React 19 + Tailwind CSS v4 |
| 数据库 | TinyDB (JSON) + Neon PostgreSQL |
| PDF渲染 | Playwright (Headless Chromium) |
| 认证 | Better Auth (邮箱密码登录) |
| 部署 | Docker 单容器一体化部署（前端+后端+API 同一端口） |

## 快速开始

### 前置要求
- Python 3.13+
- Node.js 22+
- [uv](https://docs.astral.sh/uv/)（Python 包管理器）

### 1. 克隆项目
```bash
git clone git@github.com:mountainwaterr/JD-Resume-Match.git
cd JD-Resume-Match/Resume-Matcher-new
```

### 2. 配置环境变量

创建 `.env` 文件：
```
LLM_PROVIDER=deepseek
LLM_MODEL=deepseek-chat
LLM_API_KEY=sk-your-deepseek-key
HOST=0.0.0.0
PORT=8000
FRONTEND_BASE_URL=http://localhost:3000
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
LOG_LEVEL=INFO
```

在 `apps/frontend/` 下创建 `.env` 文件（包含数据库连接和认证密钥，参考 `.env.example`）。

### 3. 一键启动（推荐）
```bash
bash dev.sh
```

### 4. 手动启动
```bash
# 终端1：后端
cd apps/backend
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

# 终端2：前端
cd apps/frontend
npm install
npm run dev
```

访问 http://localhost:3000 即可使用。

## Docker 部署

```bash
docker compose up -d
```

详见 [SETUP.md](Resume-Matcher-new/SETUP.md)。

## 项目背景

本项目借鉴了开源项目 [Resume-Matcher](https://github.com/srbhr/Resume-Matcher) 的架构思路，在此基础上进行了大幅改造和功能扩展。

## License

Apache 2.0 — 详见 [LICENSE](Resume-Matcher-new/LICENSE)
