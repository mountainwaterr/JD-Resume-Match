"""Resume-JD match analysis service."""

import json
import logging
from typing import Any

from app.database import db
from app.llm import complete_json
from app.prompts.resume_match import RESUME_MATCH_PROMPT
from app.prompts.templates import get_language_name

logger = logging.getLogger(__name__)


def _get_resume_text(resume_id: str | None, resume_text: str | None) -> str:
    """Resolve resume content — from DB by id, or direct pasted text."""
    if resume_text and resume_text.strip():
        return resume_text.strip()

    if resume_id:
        resume = db.get_resume(resume_id)
        if resume is None:
            raise ValueError(f"Resume not found: {resume_id}")
        data = resume.get("processed_data")
        if not data:
            # Fallback to raw markdown content if structured data unavailable
            raw = resume.get("content", "")
            if raw and raw.strip():
                return raw.strip()
            raise ValueError("Resume has no content — please re-upload")
        parts: list[str] = []

        # Personal info
        pi = data.get("personalInfo", {})
        if isinstance(pi, dict):
            pi_parts = [v for k, v in pi.items() if v and k not in ("id",)]
            if pi_parts:
                parts.append("=== CONTACT ===\n" + ", ".join(str(v) for v in pi_parts))

        # Summary
        summary = data.get("summary", "")
        if summary:
            parts.append(f"=== SUMMARY ===\n{summary}")

        # Skills (from additional.technicalSkills)
        additional = data.get("additional", {})
        if isinstance(additional, dict):
            skills = additional.get("technicalSkills", [])
            if isinstance(skills, list) and skills:
                parts.append("=== SKILLS ===\n" + ", ".join(str(s) for s in skills))
            certs = additional.get("certificationsTraining", [])
            if isinstance(certs, list) and certs:
                parts.append("=== CERTIFICATIONS ===\n" + ", ".join(str(c) for c in certs))
            langs = additional.get("languages", [])
            if isinstance(langs, list) and langs:
                parts.append("=== LANGUAGES ===\n" + ", ".join(str(l) for l in langs))

        # Work experience
        work = data.get("workExperience", [])
        if isinstance(work, list):
            work_lines = []
            for exp in work:
                if isinstance(exp, dict):
                    title = exp.get("title", "")
                    company = exp.get("company", "")
                    years = exp.get("years", "")
                    header = " | ".join(p for p in (title, company, years) if p)
                    work_lines.append(header)
                    desc = exp.get("description", [])
                    if isinstance(desc, list):
                        work_lines.extend(f"  - {d}" for d in desc if d)
            if work_lines:
                parts.append("=== WORK EXPERIENCE ===\n" + "\n".join(work_lines))

        # Education
        edu = data.get("education", [])
        if isinstance(edu, list):
            edu_lines = []
            for e in edu:
                if isinstance(e, dict):
                    header = " | ".join(p for p in (e.get("degree", ""), e.get("institution", ""), e.get("years", "")) if p)
                    edu_lines.append(header)
            if edu_lines:
                parts.append("=== EDUCATION ===\n" + "\n".join(edu_lines))

        # Projects
        projs = data.get("personalProjects", [])
        if isinstance(projs, list):
            proj_lines = []
            for p in projs:
                if isinstance(p, dict):
                    header = " | ".join(x for x in (p.get("name", ""), p.get("role", ""), p.get("years", "")) if x)
                    proj_lines.append(header)
                    desc = p.get("description", [])
                    if isinstance(desc, list):
                        proj_lines.extend(f"  - {d}" for d in desc if d)
            if proj_lines:
                parts.append("=== PROJECTS ===\n" + "\n".join(proj_lines))

        # Custom sections
        custom = data.get("customSections", {})
        if isinstance(custom, dict):
            for section in custom.values():
                if not isinstance(section, dict):
                    continue
                if section.get("sectionType") == "text":
                    text = section.get("text", "")
                    if text:
                        parts.append(f"=== {section.get('sectionLabel', 'OTHER').upper()} ===\n{text}")
                elif section.get("sectionType") == "stringList":
                    items = section.get("strings", [])
                    if items:
                        parts.append(f"=== {section.get('sectionLabel', 'OTHER').upper()} ===\n" + ", ".join(str(i) for i in items))
                elif section.get("sectionType") == "itemList":
                    item_lines = []
                    for item in section.get("items", []):
                        if isinstance(item, dict):
                            header = " | ".join(x for x in (item.get("title", ""), item.get("subtitle", ""), item.get("years", "")) if x)
                            item_lines.append(header)
                            desc = item.get("description", [])
                            if isinstance(desc, list):
                                item_lines.extend(f"  - {d}" for d in desc if d)
                    if item_lines:
                        parts.append(f"=== {section.get('sectionLabel', 'OTHER').upper()} ===\n" + "\n".join(item_lines))

        return "\n\n".join(parts) if parts else json.dumps(data, ensure_ascii=False)

    raise ValueError("Must provide either resume_id or resume_text")


async def analyze_resume_match(
    resume_id: str | None,
    resume_text: str | None,
    job_description: str,
    language: str = "zh",
) -> dict[str, Any]:
    """Analyze how well a resume matches a job description.

    Returns a dict with total_score, grade, summary, dimensions, top_suggestions.
    """
    output_language = get_language_name(language)
    resume_content = _get_resume_text(resume_id, resume_text)

    prompt = RESUME_MATCH_PROMPT.format(
        resume_text=resume_content,
        job_description=job_description,
        output_language=output_language,
    )

    logger.info("Resume match analysis: resume_len=%d, jd_len=%d",
                  len(resume_content), len(job_description))

    result = await complete_json(
        prompt=prompt,
        system_prompt="You are an expert hiring manager and resume reviewer. Output only valid JSON.",
        max_tokens=2048,
        schema_type="keywords",
    )

    return result
