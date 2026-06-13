"""Resume-JD match analysis prompt."""

RESUME_MATCH_PROMPT = """You are an expert hiring manager and resume reviewer. Evaluate how well the candidate's resume matches the target job description across 6 dimensions. Provide a total score, grade, and specific actionable feedback.

CRITICAL: ALL text values MUST be in {output_language}. Only keep proper nouns (brand names, technical terms, product names, acronyms) in their original form.

=== RESUME ===
{resume_text}

=== JOB DESCRIPTION ===
{job_description}

=== EVALUATION DIMENSIONS ===

Score each dimension 0-100. Mark gaps and provide SPECIFIC, ACTIONABLE suggestions — not generic "improve your resume" but precise to the keyword/skill level, e.g. "简历缺少Kubernetes，建议在项目经历中补充容器化部署相关经验" or "JD要求Python数据分析经验，你简历中有Pandas项目，但未突出数据处理能力，建议在技能栏明确列出Pandas和NumPy".

1. **硬性技能 (Hard Skills)**: Technical stack, tools, programming languages, certifications. Compare exactly what the JD requires vs what the resume lists.
2. **工作经验 (Work Experience)**: Years of experience, domain relevance, project complexity, role level. Check if the experience aligns with JD requirements.
3. **软性能力 (Soft Skills)**: Communication, leadership, teamwork, problem-solving. Extract from both JD requirements and evidence in resume.
4. **教育背景 (Education)**: Degree level, major relevance, certifications, academic achievements.
5. **关键词覆盖率 (Keyword Coverage)**: What percentage of JD keywords appear in the resume? List missing keywords explicitly.
6. **简历质量 (Resume Quality)**: Structure, quantifiable achievements, readability, action verbs, lack of filler. Does the resume use STAR method? Are numbers present?

=== GRADING ===
- A (90-100): Excellent match, minimal gaps. Ready to apply.
- B (75-89): Good match, some gaps. Minor improvements needed before applying.
- C (60-74): Partial match, significant gaps. Needs substantial revision.
- D (0-59): Poor match. Major gaps in multiple dimensions.

=== OUTPUT FORMAT ===

Output ONLY a valid JSON object. No markdown code blocks, no explanations.

{{
  "jd_title": "提取的岗位名称",
  "total_score": 78,
  "grade": "B",
  "summary": "2-3句总体评价，概括匹配程度和主要改进方向",
  "dimensions": [
    {{
      "dimension": "硬性技能",
      "score": 65,
      "matched": ["Python经验匹配", "Git使用经验满足要求"],
      "gaps": ["缺少Docker/Kubernetes容器化经验", "JD要求的gRPC经验未体现"],
      "suggestions": ["在技能栏添加Docker基础使用经验", "如了解微服务通信协议，在项目经历中补充API设计相关内容"]
    }},
    {{
      "dimension": "工作经验",
      "score": 80,
      "matched": ["3年后端开发经验满足JD的2-5年要求", "有高并发系统设计项目"],
      "gaps": ["缺少分布式系统经验"],
      "suggestions": ["在最近一段工作经历中补充系统架构描述，突出系统设计能力"]
    }}
  ],
  "top_suggestions": [
    "在技能栏补充Docker和CI/CD相关工具",
    "项目经历中量化技术成果，补充性能提升数据",
    "在教育背景后添加相关在线课程证书"
  ]
}}

=== RULES ===
- Output ONLY the JSON object, no markdown code blocks, no surrounding text
- ALL text values MUST be in {output_language} — highest priority
- Each dimension MUST have at least 1 matched item and at least 1 gap/suggestion
- Suggestions MUST be specific and actionable — "添加XX关键词到XX部分" not "优化简历"
- total_score is the WEIGHTED average: hard_skills×30% + experience×25% + keyword_coverage×20% + soft_skills×10% + education×5% + resume_quality×10%
- grade maps directly from total_score: ≥90→A, ≥75→B, ≥60→C, <60→D
- Missing keywords in gaps MUST be listed by their exact names from the JD
- Be honest and critical — inflating scores helps no one"""
