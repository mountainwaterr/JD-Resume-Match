# CLAUDE.md - Resume Matcher

> **Context file for Claude Code.** Full documentation at [docs/agent/README.md](../docs/agent/README.md).

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

Before exploring code, read [docs/agent/README.md](../docs/agent/README.md) for project orientation.

---

## Non-Negotiable Rules

1. **All frontend UI changes** MUST follow Modern Minimalist Warm Beige design system — see [tokens](../docs/portable/swiss-design-system/tokens.md) for color palette reference
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
1. [Backend guide](../docs/agent/architecture/backend-guide.md) - Architecture, modules, services
2. [API contracts](../docs/agent/apis/front-end-apis.md) - API specifications
3. [LLM integration](../docs/agent/llm-integration.md) - Multi-provider AI support

### For Frontend Changes
1. [Frontend workflow](../docs/agent/architecture/frontend-workflow.md) - User flow, components
2. [Swiss design system pack](../docs/portable/swiss-design-system/README.md) - **REQUIRED** Swiss International Style (portable pack)
3. [Next.js performance pack](../docs/portable/nextjs-performance/README.md) - **REQUIRED** Next.js 15 perf patterns (portable pack)
4. [Coding standards](../docs/agent/coding-standards.md) - Frontend conventions

### For Template/PDF Changes
1. [PDF template guide](../docs/agent/design/pdf-template-guide.md) - PDF rendering
2. [Template system](../docs/agent/design/template-system.md) - Resume templates
3. [Resume templates](../docs/agent/features/resume-templates.md) - Template types & controls

### For Features
| Feature | Documentation |
|---------|---------------|
| Custom sections | [custom-sections.md](../docs/agent/features/custom-sections.md) |
| Resume templates | [resume-templates.md](../docs/agent/features/resume-templates.md) |
| i18n | [i18n.md](../docs/agent/features/i18n.md) |
| AI enrichment | [enrichment.md](../docs/agent/features/enrichment.md) |
| JD matching | [jd-match.md](../docs/agent/features/jd-match.md) |
| JD Analysis | [page.tsx](../../apps/frontend/app/(default)/jd-analysis/page.tsx) |

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

> **Full agent documentation**: [docs/agent/README.md](../docs/agent/README.md)
