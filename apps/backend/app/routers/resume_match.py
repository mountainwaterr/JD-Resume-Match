"""Resume-JD match analysis endpoints."""

import asyncio
import logging

from fastapi import APIRouter, HTTPException

from app.schemas.resume_match import AnalyzeMatchRequest, MatchAnalysisResult
from app.services.resume_matcher import analyze_resume_match

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resume-match", tags=["resume-match"])


@router.post("/analyze", response_model=MatchAnalysisResult)
async def analyze_match(request: AnalyzeMatchRequest) -> MatchAnalysisResult:
    """Analyze how well a resume matches a job description.

    Provide either ``resume_id`` (from the database) or ``resume_text``
    (directly pasted), plus the target ``job_description``.
    Returns a 6-dimension score card with total score, grade, and
    specific improvement suggestions.
    """
    try:
        result = await asyncio.wait_for(
            analyze_resume_match(
                resume_id=request.resume_id,
                resume_text=request.resume_text,
                job_description=request.job_description,
                language=request.language or "zh",
            ),
            timeout=120.0,
        )
    except asyncio.TimeoutError:
        logger.error("Resume match analysis timed out")
        raise HTTPException(
            status_code=504,
            detail="分析超时，请尝试缩短简历或职位描述后重试",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Resume match analysis failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail="分析失败，请稍后重试",
        )

    return MatchAnalysisResult(
        total_score=result.get("total_score", 0),
        grade=result.get("grade", "C"),
        summary=result.get("summary", ""),
        jd_title=result.get("jd_title", ""),
        dimensions=result.get("dimensions", []),
        top_suggestions=result.get("top_suggestions", []),
    )
