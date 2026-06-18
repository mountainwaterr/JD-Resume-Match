"""Resume-JD match analysis schemas."""

from pydantic import BaseModel, Field, model_validator


class AnalyzeMatchRequest(BaseModel):
    """Request to analyze resume-vs-JD match."""

    resume_id: str | None = Field(default=None, max_length=50)
    resume_text: str | None = Field(default=None, max_length=20000)
    job_description: str = Field(..., min_length=50, max_length=10000)
    language: str = Field(default="zh", max_length=10)

    @model_validator(mode="after")
    def _require_resume_source(self):
        if not self.resume_id and not self.resume_text:
            raise ValueError("必须提供简历ID或直接粘贴简历文本")
        return self


class DimensionScore(BaseModel):
    """Score and analysis for one evaluation dimension."""

    dimension: str = Field(description="Dimension name in output language")
    score: int = Field(ge=0, le=100, description="Score 0-100 for this dimension")
    matched: list[str] = Field(default_factory=list, description="Well-matched items")
    gaps: list[str] = Field(default_factory=list, description="Missing or weak items")
    suggestions: list[str] = Field(
        default_factory=list,
        description="Specific, actionable improvement suggestions",
    )


class MatchAnalysisResult(BaseModel):
    """Complete resume-JD match analysis result."""

    total_score: int = Field(ge=0, le=100, description="Weighted total score")
    grade: str = Field(description="A/B/C/D grade")
    summary: str = Field(description="2-3 sentence overall assessment")
    dimensions: list[DimensionScore] = Field(description="6 dimension scores")
    top_suggestions: list[str] = Field(
        default_factory=list,
        description="Top 5 priority improvement actions",
    )
    jd_title: str = Field(default="", description="Extracted JD title")
