"""GitHub Repository Search via GitHub REST API.

No authentication needed for public repos — 60 req/hr unauthenticated.
Set GITHUB_TOKEN env var for 5000 req/hr.
"""

import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# Curated fallback repos from major AI/tech companies.
# Keyed by common skill/tech keywords (lowercase).
FALLBACK_REPOS: dict[str, list[dict[str, Any]]] = {
    "python": [
        {
            "full_name": "pandas-dev/pandas",
            "html_url": "https://github.com/pandas-dev/pandas",
            "description": "Flexible and powerful data analysis / manipulation library for Python",
            "stars": 45000, "language": "Python", "topics": ["python", "data-analysis"],
        },
        {
            "full_name": "fastapi/fastapi",
            "html_url": "https://github.com/fastapi/fastapi",
            "description": "FastAPI framework, high performance, easy to learn, fast to code",
            "stars": 82000, "language": "Python", "topics": ["python", "web", "api"],
        },
        {
            "full_name": "python/cpython",
            "html_url": "https://github.com/python/cpython",
            "description": "The Python programming language",
            "stars": 66000, "language": "Python", "topics": ["python", "interpreter"],
        },
    ],
    "machine learning": [
        {
            "full_name": "scikit-learn/scikit-learn",
            "html_url": "https://github.com/scikit-learn/scikit-learn",
            "description": "Machine learning in Python",
            "stars": 62000, "language": "Python", "topics": ["machine-learning", "python"],
        },
        {
            "full_name": "tensorflow/tensorflow",
            "html_url": "https://github.com/tensorflow/tensorflow",
            "description": "An Open Source Machine Learning Framework for Everyone",
            "stars": 190000, "language": "C++", "topics": ["machine-learning", "deep-learning"],
        },
    ],
    "deep learning": [
        {
            "full_name": "pytorch/pytorch",
            "html_url": "https://github.com/pytorch/pytorch",
            "description": "Tensors and Dynamic neural networks in Python with strong GPU acceleration",
            "stars": 88000, "language": "Python", "topics": ["deep-learning", "pytorch"],
        },
    ],
    "llm": [
        {
            "full_name": "vllm-project/vllm",
            "html_url": "https://github.com/vllm-project/vllm",
            "description": "A high-throughput and memory-efficient inference and serving engine for LLMs",
            "stars": 48000, "language": "Python", "topics": ["llm", "inference"],
        },
        {
            "full_name": "langchain-ai/langchain",
            "html_url": "https://github.com/langchain-ai/langchain",
            "description": "Build context-aware reasoning applications",
            "stars": 103000, "language": "Python", "topics": ["llm", "framework"],
        },
        {
            "full_name": "huggingface/transformers",
            "html_url": "https://github.com/huggingface/transformers",
            "description": "State-of-the-art Machine Learning for PyTorch, TensorFlow, and JAX",
            "stars": 141000, "language": "Python", "topics": ["nlp", "transformers"],
        },
    ],
    "ai agent": [
        {
            "full_name": "anthropics/anthropic-cookbook",
            "html_url": "https://github.com/anthropics/anthropic-cookbook",
            "description": "A collection of notebooks/recipes showcasing some fun and effective ways of using Claude",
            "stars": 12000, "language": "Jupyter Notebook", "topics": ["anthropic", "claude"],
        },
        {
            "full_name": "microsoft/autogen",
            "html_url": "https://github.com/microsoft/autogen",
            "description": "A programming framework for agentic AI (Microsoft)",
            "stars": 43000, "language": "Python", "topics": ["ai-agent", "multi-agent"],
        },
        {
            "full_name": "crewAIInc/crewAI",
            "html_url": "https://github.com/crewAIInc/crewAI",
            "description": "Framework for orchestrating role-playing, autonomous AI agents",
            "stars": 28000, "language": "Python", "topics": ["ai-agent", "multi-agent"],
        },
    ],
    "docker": [
        {
            "full_name": "docker/compose",
            "html_url": "https://github.com/docker/compose",
            "description": "Define and run multi-container applications with Docker",
            "stars": 35000, "language": "Go", "topics": ["docker", "containers"],
        },
    ],
    "kubernetes": [
        {
            "full_name": "kubernetes/kubernetes",
            "html_url": "https://github.com/kubernetes/kubernetes",
            "description": "Production-Grade Container Scheduling and Management",
            "stars": 115000, "language": "Go", "topics": ["kubernetes", "containers"],
        },
    ],
    "react": [
        {
            "full_name": "facebook/react",
            "html_url": "https://github.com/facebook/react",
            "description": "The library for web and native user interfaces (Meta)",
            "stars": 236000, "language": "JavaScript", "topics": ["react", "frontend"],
        },
    ],
    "typescript": [
        {
            "full_name": "microsoft/typescript",
            "html_url": "https://github.com/microsoft/typescript",
            "description": "TypeScript is a superset of JavaScript (Microsoft)",
            "stars": 104000, "language": "TypeScript", "topics": ["typescript", "javascript"],
        },
    ],
    "golang": [
        {
            "full_name": "golang/go",
            "html_url": "https://github.com/golang/go",
            "description": "The Go programming language (Google)",
            "stars": 128000, "language": "Go", "topics": ["go", "golang"],
        },
    ],
    "rust": [
        {
            "full_name": "rust-lang/rust",
            "html_url": "https://github.com/rust-lang/rust",
            "description": "Empowering everyone to build reliable and efficient software",
            "stars": 105000, "language": "Rust", "topics": ["rust", "systems"],
        },
    ],
}

# Major tech company orgs — projects from these are prioritized in results.
PRIORITY_ORGS = {
    "anthropics", "openai", "microsoft", "google", "meta",
    "facebook", "apple", "amazon", "netflix", "bytedance",
    "alibaba", "tencent", "baidu", "huggingface", "deepseek",
    "langchain-ai", "vllm-project", "crewAIInc", "fastapi",
    "pytorch", "tensorflow", "pandas-dev", "scikit-learn",
    "kubernetes", "docker", "golang", "rust-lang", "gradio-app",
    "streamlit", "sgl-project", "microsoft/autogen",
}


def _is_priority_repo(full_name: str) -> bool:
    """Check if repo belongs to a major company or well-known org."""
    org = full_name.split("/")[0].lower() if "/" in full_name else ""
    return org in PRIORITY_ORGS


def _match_fallback(query: str) -> list[dict[str, Any]]:
    """Return curated fallback repos matching the query keywords."""
    q_lower = query.lower()
    results: list[dict[str, Any]] = []
    seen: set[str] = set()
    for keyword, repos in FALLBACK_REPOS.items():
        if keyword in q_lower:
            for repo in repos:
                if repo["full_name"] not in seen:
                    seen.add(repo["full_name"])
                    results.append(dict(repo, why_match="", difficulty=""))
    return results[:3]


async def search_github_repos(
    query: str,
    n: int = 3,
    language: str | None = None,
) -> list[dict[str, Any]]:
    """Search GitHub for repositories matching a topic query.

    Args:
        query: Search keywords (e.g. "AI Agent framework")
        n: Number of repos to return (max 3)
        language: Optional language filter (e.g. "python", "typescript")

    Returns:
        List of dicts with: full_name, html_url, description, stars, language, topics
    """
    n = min(n, 3)
    q = f"{query} stars:>500"
    if language:
        q += f" language:{language}"

    url = f"{GITHUB_API}/search/repositories"
    params: dict[str, str | int] = {
        "q": q,
        "sort": "stars",
        "order": "desc",
        "per_page": n,
    }
    headers: dict[str, str] = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ResumeMatcher/2.0",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        items = data.get("items", [])

        # Sort: priority orgs first, then by stars desc
        def sort_key(item: dict) -> tuple[int, int]:
            full_name = item.get("full_name", "")
            priority = 0 if _is_priority_repo(full_name) else 1
            stars = item.get("stargazers_count", 0)
            return (priority, -stars)

        items.sort(key=sort_key)

        # Drop repos below 500 stars — keep only well-established projects
        qualified = [it for it in items if it.get("stargazers_count", 0) >= 500]

        results = [
            {
                "full_name": item["full_name"],
                "html_url": item["html_url"],
                "description": item.get("description") or "",
                "stars": item["stargazers_count"],
                "language": item.get("language") or "",
                "topics": item.get("topics", []),
                "why_match": "",
                "difficulty": "",
            }
            for item in qualified[:n]
        ]

        if not results:
            raise ValueError("GitHub API returned empty results")

        return results

    except (httpx.HTTPStatusError, Exception) as e:
        if isinstance(e, httpx.HTTPStatusError):
            logger.warning("GitHub API error for query '%s': %s", query, e)
        else:
            logger.warning("GitHub search failed for '%s': %s", query, e)

        # Try fallback curated repos
        fallback = _match_fallback(query)
        if fallback:
            logger.info("Using %d fallback repos for '%s'", len(fallback), query)
            return fallback

        return []  # Graceful fallback — empty results instead of crash
