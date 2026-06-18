# CLAUDE.md - Resume Matcher

> **Context file for Claude Code.** Full documentation at [docs/agent/README.md](docs/agent/README.md).

---

## 通用编码规则 (Universal Coding Rules)

**规则1: 编码前先思考 (Think Before Coding)** — 明确陈述假设；不确定的地方要提问而不是靠猜；暴露权衡，列出多种方案的优缺点；如果存在更简单的方法，要予以反驳。

**规则2: 简洁优先 (Simplicity First)** — 只写能解决问题的最少代码；不写投机性功能；不为单次使用的代码做抽象；如果资深工程师会觉得过度复杂——简化它。

**规则3: 外科手术式修改 (Surgical Changes)** — 只触碰必须修改的地方；不要顺便"优化"无关的代码、注释或格式；不重构没坏的东西；匹配现有风格。

**规则4: 目标驱动执行 (Goal-Driven Execution)** — 定义成功标准并循环直到验证成功；不要告诉Claude执行步骤，而是定义"成功是什么样"，让它自己迭代；能用更少步骤达成就用更少步骤。

**规则5: 确定性逻辑禁止交给模型 (No Non-Language Work)** — 重试策略、路由逻辑、阈值判断等确定性决策必须写成显式代码（条件语句、配置值、查找表）；如果答案每次都一样，那它就不是语言任务；模型只负责分类、摘要、草稿、歧义消解。

**规则6: 硬性Token预算，无例外 (Hard Token Budgets)** — 每个迭代循环（调试、重构、生成）都必须设定预算（最大迭代次数、token数或耗时），具体数值根据项目实际设定。预算耗尽时立即停止并展示当前结果；已被拒绝的修复方案不要再次建议。

**规则7: 暴露冲突，不要折中 (Surface Conflicts)** — 当代码库存在两种矛盾模式时，明确指出冲突（"模块A用模式X，模块B用模式Y，新代码该遵循哪个？"），等待人类决策；不要混合（Blend）两种模式，更不要自行选择。

**规则8: 先读再写 (Read Before You Write)** — 在添加代码前，必须阅读当前文件及其导入关系文件，检查是否已存在功能相同的函数、工具方法或常量；如果已有重复实现，直接使用，不要创建第二个版本。

**规则9: 测试必须有，但不是目的 (Tests Verify Intent)** — 测试要验证正确行为的有意义属性（值、结构、副作用、错误类型），而非仅验证"函数有返回值"或"不报错"；"所有测试通过"是必要条件但非充分条件；测试太弱时要明确指出。

**规则10: 长任务需要检查点 (Task Checkpoints)** — 超过3步或修改超过3个文件的任务，每步都要总结进度（做了什么+改了什么+当前状态）；某步失败时回滚到上一个检查点，不在错误状态上继续；失去逻辑追踪时立即停止并重述。

**规则11: 惯例优先于新颖 (Convention Beats Novelty)** — 即使你认为自己的写法更好，也要遵从代码库现有的命名和架构惯例（如 snake_case vs camelCase）；引入第二种模式比任何单一模式都更糟糕；认为惯例该改时，明确提出并等待批准后再行动。

**规则12: 失败必须显性化 (Fail Loud)** — 错误必须被抛出、返回或上报，严禁吞掉或藏在默认值背后；迁移、批处理跳过记录时，跳过数量和原因必须在输出中展示而非埋在日志里；不能100%确认成功时，必须明确说明，严禁默认成功。

---

## Auto-Use Skills

When working in this project, **proactively use** the following skills without the user needing to ask:

### `shushu-internship-tool` (鼠鼠实习妙妙工具)
**Auto-trigger when** the user mentions any of:
- 岗位描述 / JD / job description analysis → planning internship projects
- "帮我找个项目" / "推荐GitHub项目" / find projects for a role
- "准备面试" / interview preparation / STAR resume bullets
- "审计代码" / audit a cloned repo
- "怎么复现这个项目" / "跑不通" / figuring out how to run a project
- "改造/魔改" / modifying an open-source project for resume value
- Career/role: 后端/前端/全栈/移动端/测试/数据工程/云原生/安全/系统/AI/算法

This skill works hand-in-hand with the built-in **JD Analysis** feature — JD Analysis extracts skill requirements, and SIT turns those into concrete projects + interview materials.

### When NOT to use SIT
- Pure coding/debugging within the Resume-Matcher codebase itself
- General programming questions unrelated to internship/job hunting
- The user is working on Resume-Matcher features (not their own career prep)

---

## Project Overview

Resume Matcher is an AI-powered application for tailoring resumes to job descriptions.

| Layer | Stack |
|-------|-------|
| **Backend** | FastAPI + Python 3.13+, LiteLLM (default: DeepSeek) |
| **Frontend** | Next.js 16 + React 19, Tailwind CSS v4 |
| **Database** | TinyDB (JSON file storage) |
| **PDF** | Headless Chromium via Playwright |

---

## First Steps

Before exploring code, read [docs/agent/README.md](docs/agent/README.md) for project orientation.

---

## Non-Negotiable Rules

1. **All frontend UI changes** MUST follow Modern Minimalist Warm Beige design system — see [tokens](docs/portable/swiss-design-system/tokens.md) for color palette reference
2. **All Python functions** MUST have type hints
3. **Run `npm run lint`** before committing frontend changes
4. **Run `npm run format`** (Prettier) before committing
5. **Log detailed errors server-side**, return generic messages to clients
6. **Do NOT modify** `.github/workflows/` files without explicit request

---

## Essential Commands

```bash
# Backend (from repo root)
cd apps/backend
uv sync                                              # Install Python dependencies
uv run uvicorn app.main:app --reload --port 8000     # FastAPI on :8000

# Frontend (from repo root, in a separate terminal)
cd apps/frontend
npm install                                          # Install Node.js dependencies
npm run dev                                          # Next.js on :3000

# Quality checks (from apps/frontend)
npm run lint          # Lint frontend
npm run format        # Format with Prettier

# Build (from apps/frontend)
npm run build
```

---

## Project Structure

```
apps/
├── backend/                 # FastAPI + Python
│   ├── app/
│   │   ├── main.py          # Entry point
│   │   ├── config.py        # Environment settings
│   │   ├── database.py      # TinyDB wrapper
│   │   ├── llm.py           # LiteLLM wrapper
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── schemas/         # Pydantic models
│   │   ├── prompts/         # LLM prompt templates
│   └── jd_analysis/     # JD Analysis (multi-JD skill extraction + learning path)
│   └── data/                # Database storage
│
└── frontend/                # Next.js + React
    ├── app/                 # Pages (dashboard, builder, tailor, print)
    ├── components/          # UI components
    ├── lib/                 # Utilities, API client
    ├── hooks/               # Custom React hooks
    └── messages/            # i18n translations (en, es, zh, ja)
```

---

## Documentation by Task

### For Backend Changes
1. [Backend guide](docs/agent/architecture/backend-guide.md) - Architecture, modules, services
2. [API contracts](docs/agent/apis/front-end-apis.md) - API specifications
3. [LLM integration](docs/agent/llm-integration.md) - Multi-provider AI support

### For Frontend Changes
1. [Frontend workflow](docs/agent/architecture/frontend-workflow.md) - User flow, components
2. [Swiss design system pack](docs/portable/swiss-design-system/README.md) - **REQUIRED** Swiss International Style (portable pack)
3. [Next.js performance pack](docs/portable/nextjs-performance/README.md) - **REQUIRED** Next.js 15 perf patterns (portable pack)
4. [Coding standards](docs/agent/coding-standards.md) - Frontend conventions

### For Template/PDF Changes
1. [PDF template guide](docs/agent/design/pdf-template-guide.md) - PDF rendering
2. [Template system](docs/agent/design/template-system.md) - Resume templates
3. [Resume templates](docs/agent/features/resume-templates.md) - Template types & controls

### For Features
| Feature | Documentation |
|---------|---------------|
| Custom sections | [custom-sections.md](docs/agent/features/custom-sections.md) |
| Resume templates | [resume-templates.md](docs/agent/features/resume-templates.md) |
| i18n | [i18n.md](docs/agent/features/i18n.md) |
| AI enrichment | [enrichment.md](docs/agent/features/enrichment.md) |
| JD matching | [jd-match.md](docs/agent/features/jd-match.md) |
| JD Analysis | [page.tsx](apps/frontend/app/(default)/jd-analysis/page.tsx) |

---

## Code Patterns

### Backend Error Handling
```python
except Exception as e:
    logger.error(f"Operation failed: {e}")
    raise HTTPException(status_code=500, detail="Operation failed. Please try again.")
```

### Frontend Textarea Fix
All textareas need Enter key handling:
```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter') e.stopPropagation();
};
```

### Mutable Defaults (Python)
Always use `copy.deepcopy()` for mutable defaults:
```python
import copy
data = copy.deepcopy(DEFAULT_DATA)  # Correct
# data = DEFAULT_DATA  # Wrong - shared state bug
```

---

## Design System Quick Reference

| Element | Value |
|---------|-------|
| Canvas background | `#F5F0EB` (warm beige) |
| Card surface | `#FFFFFF` |
| Ink (text) | `#2D2D2D` |
| Muted text | `#8B8682` |
| Primary (links/buttons) | `#C2855C` (warm terracotta) |
| Success | `#15803D` |
| Warning | `#F97316` |
| Destructive | `#DC2626` |
| Headers font | `font-serif` |
| Body font | `font-sans` |
| Borders | `rounded-lg` (8px), soft warm `#D1CCC7` |

---

## Definition of Done

Before completing a task:

- [ ] Code compiles without errors
- [ ] `npm run lint` passes
- [ ] UI changes follow Modern Minimalist Warm Beige design
- [ ] Python functions have type hints
- [ ] Schema/prompt changes documented

---

## Out of Scope

Do NOT modify without explicit request:
- `.github/workflows/` files
- CI/CD configuration
- Docker build behavior
- Existing tests (removal/disabling)

---

> **Full agent documentation**: [docs/agent/README.md](docs/agent/README.md)
