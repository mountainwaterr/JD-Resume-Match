"""Pydantic models for JD analysis: skills extraction + staged learning path."""

from pydantic import BaseModel, Field, field_validator


# ── Request ──────────────────────────────────────────────────────────

class AnalyzeJDsRequest(BaseModel):
    """Request to analyze one or more job descriptions."""

    job_descriptions: list[str] = Field(
        min_length=1,
        max_length=10,
        description="List of job description texts to analyze",
    )
    language: str = Field(
        default="zh",
        max_length=10,
        description="Output language code (zh, en, ja, etc.)",
    )

    @field_validator("job_descriptions")
    @classmethod
    def _validate_job_descriptions(cls, value: list[str]) -> list[str]:
        for i, desc in enumerate(value):
            if not desc or not desc.strip():
                raise ValueError(f"job_descriptions[{i}] 不能为空")
            if len(desc) > 10000:
                raise ValueError(f"job_descriptions[{i}] 过长（最多10000个字符）")
        return value


# ── Phase 1: Skills Analysis ─────────────────────────────────────────

class SkillCategory(BaseModel):
    """A group of related skills identified in the JDs."""

    category: str
    skills: list[str]
    importance: str  # "required" | "preferred" | "nice-to-have"


class ExperienceRequirement(BaseModel):
    """An experience requirement extracted from the JDs."""

    description: str
    level: str  # "entry" | "mid" | "senior" | "lead"


class IndustryInsight(BaseModel):
    """An industry trend or pattern observed across JDs."""

    topic: str
    detail: str


class SkillsAnalysisResult(BaseModel):
    """Structured skills analysis extracted from job descriptions."""

    summary: str
    skill_categories: list[SkillCategory] = Field(default_factory=list)
    experience_requirements: list[ExperienceRequirement] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    education_requirements: list[str] = Field(default_factory=list)
    industry_insights: list[IndustryInsight] = Field(default_factory=list)
    cross_jd_patterns: list[str] = Field(default_factory=list)


# ── Phase 2: Learning Path ───────────────────────────────────────────

class Reading(BaseModel):
    """Recommended reading for a learning stage."""

    title: str          # e.g. "Python官方教程"
    url: str            # e.g. "https://docs.python.org/zh-cn/3/tutorial/"
    description: str    # One-line description


class GitHubRepo(BaseModel):
    """A GitHub repository recommended for a learning stage.

    Fields from GitHub API (filled by backend enrichment):
        full_name, html_url, description, stars, language, topics
    Fields from LLM (project_specs):
        difficulty_stars, estimated_time, why_learn, covers_abilities
    """

    full_name: str = ""
    html_url: str = ""
    description: str = ""
    stars: int = 0
    language: str = ""
    topics: list[str] = Field(default_factory=list)

    difficulty_stars: int = 1         # ⭐ 1-5
    estimated_time: str = ""          # "3天", "1周"
    why_learn: str = ""               # Learner-perspective: what you'll learn
    covers_abilities: list[str] = Field(default_factory=list)


class LearningStage(BaseModel):
    """One stage in the learning path, ordered by dependency."""

    order: int                       # Stage number (1-based)
    topic: str                       # Stage title
    goal: str                        # One-sentence goal
    prerequisites: str               # "无" or "阶段1, 阶段2"
    difficulty: str                  # "入门" | "进阶" | "高级"
    abilities_covered: list[str] = Field(default_factory=list)
    readings: list[Reading] = Field(default_factory=list)
    expected_output: str             # Concrete deliverable
    projects: list[GitHubRepo] = Field(default_factory=list)


class LearningPath(BaseModel):
    """Complete staged learning path with GitHub project recommendations."""

    target_role: str
    role_type: str  # "technical" | "non_technical" | "hybrid"
    current_gap_summary: str
    stages: list[LearningStage] = Field(default_factory=list)
    additional_tips: list[str] = Field(default_factory=list)


class JDAnalysisResult(BaseModel):
    """Complete JD analysis: skills analysis + learning path."""

    analysis_id: str
    skills_analysis: SkillsAnalysisResult
    learning_path: LearningPath
    job_descriptions: list[str]
    created_at: str
    title: str
