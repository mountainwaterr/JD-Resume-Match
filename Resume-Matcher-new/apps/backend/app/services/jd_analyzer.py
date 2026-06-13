"""JD (Job Description) analysis service.

Single-call LLM pipeline:
Extracts skills AND generates learning path in one round-trip.
"""

import hashlib
import logging
from typing import Any

from app.llm import complete_json
from app.prompts.jd_analysis import JD_COMBINED_ANALYSIS_PROMPT
from app.prompts.templates import get_language_name

logger = logging.getLogger(__name__)


def compute_content_hash(job_descriptions: list[str]) -> str:
    """Compute SHA256 hash of concatenated JDs for cache lookups."""
    combined = "\n---JOB SEPARATOR---\n".join(job_descriptions)
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


def generate_title(skills_analysis: dict[str, Any]) -> str:
    """Derive a short human-readable title from the analysis summary."""
    summary = skills_analysis.get("summary", "")
    if len(summary) > 80:
        summary = summary[:77].rsplit(" ", 1)[0] + "..."
    return summary or "JD Analysis"


async def analyze_jds(
    job_descriptions: list[str],
    language: str = "zh",
) -> dict[str, Any]:
    """Run JD analysis — single LLM call for skills + learning path.

    Returns dict with keys ``skills_analysis`` and ``learning_path``.
    """
    output_language = get_language_name(language)
    jds_text = "\n\n---\n\n".join(
        f"Job Description #{i + 1}:\n{jd}" for i, jd in enumerate(job_descriptions)
    )

    logger.info("JD Analysis: running combined skills+learning path for %d JDs", len(job_descriptions))
    prompt = JD_COMBINED_ANALYSIS_PROMPT.format(
        job_descriptions=jds_text,
        output_language=output_language,
    )
    result = await complete_json(
        prompt=prompt,
        system_prompt="You are an expert job market analyst and career coach. Output only valid JSON.",
        max_tokens=4096,
        schema_type="keywords",
    )

    return {
        "skills_analysis": result.get("skills_analysis", {}),
        "learning_path": result.get("learning_path", {}),
    }
