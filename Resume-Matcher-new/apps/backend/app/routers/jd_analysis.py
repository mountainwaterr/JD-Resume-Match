"""JD (Job Description) analysis endpoints.

Two-phase pipeline:
1. POST /analyze  — submit JDs, get back skills analysis + staged learning path
2. GET  /{id}     — retrieve a saved analysis
3. GET  /         — list all saved analyses (summary only)
"""

import asyncio
import logging

from fastapi import APIRouter, HTTPException

from app.database import db
from app.schemas.jd_analysis import AnalyzeJDsRequest, JDAnalysisResult
from app.services.github_search import search_github_repos
from app.services.jd_analyzer import analyze_jds, compute_content_hash, generate_title

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jd-analysis", tags=["JD Analysis"])


@router.get("/")
async def list_analyses() -> list[dict]:
    """List all saved JD analyses (summary only)."""
    analyses = db.list_jd_analyses()
    sorted_analyses = sorted(
        analyses, key=lambda a: a.get("created_at", ""), reverse=True
    )
    return [
        {
            "analysis_id": a["analysis_id"],
            "title": a.get("title", "JD Analysis"),
            "created_at": a["created_at"],
            "job_count": len(a.get("job_descriptions", [])),
        }
        for a in sorted_analyses
    ]


def _build_return(doc: dict) -> JDAnalysisResult:
    """Build JDAnalysisResult from a DB document."""
    learning_path = doc.get(
        "learning_path",
        doc.get("project_recommendations"),  # fallback for old cached analyses
    )
    return JDAnalysisResult(
        analysis_id=doc["analysis_id"],
        skills_analysis=doc["skills_analysis"],
        learning_path=learning_path,
        job_descriptions=doc["job_descriptions"],
        created_at=doc["created_at"],
        title=doc.get("title", "JD Analysis"),
    )


@router.post("/analyze")
async def analyze_job_descriptions(request: AnalyzeJDsRequest) -> JDAnalysisResult:
    """Analyze multiple JDs and generate a staged learning path.

    Accepts an array of job description strings, runs a two-phase LLM
    pipeline to extract skills and build a staged learning path with
    GitHub project recommendations per stage.
    """
    if not request.job_descriptions:
        raise HTTPException(status_code=400, detail="No job descriptions provided")

    for jd in request.job_descriptions:
        if not jd.strip():
            raise HTTPException(status_code=400, detail="Empty job description")
        if len(jd.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Each job description must be at least 50 characters",
            )

    # Cache check via content hash
    content_hash = compute_content_hash(request.job_descriptions)
    cached = db.get_jd_analysis_by_hash(content_hash)
    if cached:
        logger.info("Returning cached JD analysis for hash %s", content_hash[:12])
        return _build_return(cached)

    try:
        result = await asyncio.wait_for(
            analyze_jds(request.job_descriptions, language=request.language),
            timeout=150.0,
        )
    except asyncio.TimeoutError:
        logger.error("JD analysis timed out")
        raise HTTPException(
            status_code=504,
            detail="Analysis timed out. Try with fewer or shorter job descriptions.",
        )
    except ValueError as e:
        logger.error("JD analysis failed (content): %s", e)
        raise HTTPException(
            status_code=422,
            detail="The AI returned an unreadable response. Please try again.",
        )
    except Exception as e:
        logger.error("JD analysis failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze job descriptions. Please try again.",
        )

    # Enrich learning path stages with real GitHub repos (parallelized)
    learning_path = result.get("learning_path", {})
    stages = learning_path.get("stages", [])

    # Collect all (stage_idx, spec_idx, llm_metadata, query) tasks
    search_tasks = []
    for si, stage in enumerate(stages):
        for pi, spec in enumerate(stage.get("project_specs", [])):
            query = spec.get("github_search_query", "")
            if query:
                # Attach LLM metadata for later merging
                meta = {
                    "difficulty_stars": spec.get("difficulty_stars", 3),
                    "estimated_time": spec.get("estimated_time", ""),
                    "why_learn": spec.get("why_learn", ""),
                    "covers_abilities": spec.get("covers_abilities", []),
                }
                search_tasks.append((si, pi, meta, query))

    if search_tasks:
        async def _search_one(si, pi, meta, query):
            repos = await search_github_repos(query, n=3)
            for r in repos:
                r.update(meta)
            return si, pi, repos

        results = await asyncio.gather(
            *[_search_one(si, pi, meta, q) for si, pi, meta, q in search_tasks]
        )

        # Fill results back into stages, deduplicate by full_name
        seen = set()
        for si, pi, repos in results:
            if "projects" not in stages[si]:
                stages[si]["projects"] = []
            for repo in repos:
                if repo["full_name"] not in seen:
                    seen.add(repo["full_name"])
                    stages[si]["projects"].append(repo)

        # Trim per stage: sort by stars desc, keep top N based on difficulty
        for stage in stages:
            projs = stage.get("projects", [])
            projs.sort(key=lambda r: r.get("stars", 0), reverse=True)
            difficulty = stage.get("difficulty", "进阶")
            keep = 3 if difficulty == "入门" else 2
            stage["projects"] = projs[:keep]

        # Clean up project_specs — user sees real repos only
        for stage in stages:
            stage.pop("project_specs", None)

    title = generate_title(result["skills_analysis"])
    doc = db.create_jd_analysis(
        job_descriptions=request.job_descriptions,
        content_hash=content_hash,
        skills_analysis=result["skills_analysis"],
        learning_path=result["learning_path"],
        title=title,
    )

    return _build_return(doc)


@router.get("/{analysis_id}")
async def get_analysis(analysis_id: str) -> JDAnalysisResult:
    """Retrieve a saved JD analysis by ID."""
    doc = db.get_jd_analysis(analysis_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return _build_return(doc)
