# AI简历助手 (AI Resume Assistant)

> AI 驱动的简历优化工具 — 上传简历 + 粘贴职位描述 → AI 自动分析匹配度 → 生成定制化简历和求职信 → 导出 PDF

## 这是什么？

求职者面临的核心痛点：同一份简历投所有岗位缺乏针对性、看不懂JD关键词、写求职信耗时、不知道自己和岗位的差距。

AI简历助手解决这些问题：它不是一个简单的模板填充工具，而是真正用 AI 分析职位描述(JD)，量化匹配度（0-100分 6维度评分），逐条给出简历修改建议，还能生成定制化求职信。

**核心差异点**：不只生成，更能量化匹配度；AI 简历润色采用问答式引导而非一键填充，确保不编造经历。

## 功能

| 功能 | 说明 |
|------|------|
| **简历管理** | 上传PDF/DOCX简历、可视化编辑（个人信息/经历/技能/教育）、自定义章节拖拽排序、多版本管理 |
| **AI简历定制** | 粘贴JD → AI分析关键要求 → 生成改进预览（原文vs修改后逐条对比）→ 确认后保存为新版本 |
| **AI匹配分析** | 简历 vs JD 6维度评分（技能/经验/教育/语言/项目/综合）、差距分析、改进建议 |
| **AI简历润色** | 智能识别薄弱条目 → STAR法则引导补充信息 → AI重写为专业表达 |
| **JD分析** | 批量上传多份JD → 提取技能并分类（必备/加分/软技能）→ 生成学习路径 + GitHub项目推荐 |
| **求职信生成** | AI根据简历+JD自动生成定制化求职信 |
| **AI聊天助手** | 简历/求职相关问题对话 |
| **4套简历模板** | 瑞士单栏/双栏、现代单栏/双栏，实时预览，PDF导出 |
| **多语言** | UI支持中文/英文/日文/西班牙文，AI自动检测简历语言输出对应语种 |
| **用户系统** | 邮箱注册/登录，简历数据按用户隔离 |

## 技术栈

| 层 | 技术 |
|----|------|
| AI引擎 | LiteLLM（支持DeepSeek/OpenAI/Ollama等，可灵活切换） |
| 后端 | FastAPI + Python 3.13+ |
| 前端 | Next.js 16 + React 19 + Tailwind CSS v4 |
| 数据库 | TinyDB (JSON) + Neon PostgreSQL |
| PDF渲染 | Playwright (Headless Chromium) |
| 认证 | Better Auth (邮箱密码登录) |

## 本地运行

### 前置要求
- Python 3.13+
- Node.js 22+
- Ollama（本地运行AI模型，可选；也可使用云端API）

### 1. 克隆项目
```bash
git clone git@github.com:mountainwaterr/JD-Resume-Match.git
cd JD-Resume-Match
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：
```
LLM_PROVIDER=ollama
LLM_MODEL=qwen3:8b
LLM_API_KEY=
LLM_API_BASE=http://localhost:11434
HOST=0.0.0.0
PORT=8000
FRONTEND_BASE_URL=http://localhost:3000
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
LOG_LEVEL=INFO
```

在 `apps/frontend/` 下创建 `.env` 文件（包含数据库连接和认证密钥，参考 `.env.example`）。

### 3. 启动后端
```bash
cd apps/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. 启动前端
```bash
cd apps/frontend
npm install
npm run dev
```

访问 http://localhost:3000 即可使用。

## 项目背景

本项目借鉴了开源项目 [Resume-Matcher](https://github.com/srbhr/Resume-Matcher) 的架构思路，在此基础上进行了大幅改造和功能扩展，包括但不限于：用户系统、多语言支持、AI简历润色、JD批量分析、简历模板系统等。

## License

Apache 2.0 — 详见 [LICENSE](LICENSE)
