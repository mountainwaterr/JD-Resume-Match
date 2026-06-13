"""Prompt templates for JD (Job Description) analysis and learning path generation."""

JD_SKILLS_ANALYSIS_PROMPT = """Analyze the following job descriptions for a target role. Extract and aggregate ALL skills, requirements, and patterns across the provided JDs.

CRITICAL: ALL text values in the JSON output MUST be in {output_language}. This includes summary, category names, skill descriptions, experience descriptions, soft skills, education requirements, industry insights, and cross-JD patterns. Only keep proper nouns (brand names like "Coze", "Dify", "Kubernetes"; product names; company names; technical acronyms) in their original form.

Output ONLY a valid JSON object. No markdown, no explanations.

Job Descriptions:
{job_descriptions}

Tasks:
1. Identify ALL technical skills mentioned across the JDs, grouped into logical categories. Category names MUST be in {output_language} (e.g., "编程语言", "云计算与DevOps", "数据分析" for Chinese).
2. Classify each skill's importance based on how frequently it appears across JDs:
   - "required": mentioned in most JDs as mandatory
   - "preferred": mentioned as "nice to have" or "bonus" in multiple JDs
   - "nice-to-have": mentioned occasionally or as optional
3. Extract experience requirements (years, domains, levels) — descriptions in {output_language}
4. List soft skills that appear across JDs — in {output_language}
5. List education or certification requirements — in {output_language}
6. Identify industry insights and technology trends visible across the JDs — in {output_language}
7. Note recurring patterns across JDs — in {output_language}

Output format:
{{
  "summary": "用2-3句话总结该岗位在所有已分析JD中的典型要求",
  "skill_categories": [
    {{
      "category": "编程语言",
      "skills": ["Python", "Java", "TypeScript"],
      "importance": "required"
    }}
  ],
  "experience_requirements": [
    {{ "description": "5年以上后端开发经验", "level": "senior" }}
  ],
  "soft_skills": ["沟通能力", "团队协作", "问题解决能力"],
  "education_requirements": ["计算机科学或相关专业本科学位"],
  "industry_insights": [
    {{ "topic": "云原生趋势", "detail": "80%的JD提到云平台经验，表明这已成为基本要求" }}
  ],
  "cross_jd_patterns": [
    "Docker和Kubernetes在5份JD中的4份同时出现，说明容器化是核心要求",
    "每份JD都提到了敏捷/Scrum方法论"
  ]
}}

IMPORTANT:
- Output ONLY the JSON object, no markdown code blocks, no surrounding text
- ALL text content MUST be in {output_language} — this is the highest priority rule
- Only technical proper nouns (product names, brand names, acronyms) stay in original language
- Be thorough: include every skill/tool/technology mentioned in any JD
- Use the importance field to help job seekers prioritize what to learn first
- Cross-JD patterns should highlight actionable insights for job seekers
- Industry insights should help job seekers understand market trends"""

JD_LEARNING_PATH_PROMPT = """You are an experienced career coach and technical educator. Based on the skills analysis below, create a staged learning path with clear dependency order for a job seeker targeting this role.

CRITICAL: ALL text values in the JSON output MUST be in {output_language}. Only keep proper nouns (brand names, product names, technical acronyms, URLs) in their original form.

STEP 0 — Determine Role Type:
First, classify the target role as "technical", "non_technical", or "hybrid":

TECHNICAL (role_type="technical"):
- Role requires programming, algorithms, systems, data engineering, AI/ML, DevOps, testing, or architecture
- Title keywords: 开发/工程师/算法/AI/ML/数据/DevOps/测试/架构/全栈/前端/后端/移动端/嵌入式/安全

NON_TECHNICAL (role_type="non_technical"):
- Role requires product thinking, operations, marketing, design, management, or other non-coding skills
- Title keywords: 产品/运营/市场/设计/HR/销售/客服/行政/商务/策划/品牌/新媒体/内容/用户研究

HYBRID (role_type="hybrid"):
- Role combines AI/tech knowledge WITH product/operations responsibilities
- Typical titles: AI产品经理/AI产品运营/AI解决方案/技术产品经理/AI项目经理/AI增长/Agent产品经理

Skills Analysis:
{skills_analysis}

Your task: Design a staged learning path (5-8 stages) that builds skills in dependency order. Earlier stages should be prerequisites for later stages. Each stage focuses on one or a tightly related group of abilities.

=== STAGE DESIGN RULES ===

1. **Dependency order**: Stage N+1 must depend on skills built in Stage N. Earlier stages must be prerequisites.
2. **Group related abilities**: Don't put unrelated skills in one stage. But closely related skills (e.g., "Python + Pandas") can be one stage.
3. **Output-first**: Each stage must produce something concrete and demonstrable.
4. **Reading priority**: Recommend official docs first, then authoritative tutorials, then classic papers/blogs.
5. **Project specs**: Each stage must have 1-3 project_specs with detailed learning metadata.

=== OUTPUT FORMAT ===

{{
  "target_role": "AI产品经理",
  "role_type": "hybrid",
  "current_gap_summary": "当前技能与目标岗位的主要差距在于缺乏Python编程基础、LLM技术理解和AI产品设计经验。学习路径从编程基础开始，逐步过渡到AI技术应用，最终整合为完整的AI产品设计能力。",
  "stages": [
    {{
      "order": 1,
      "topic": "Python编程基础",
      "goal": "能够用Python编写数据处理脚本，理解基本语法和常用标准库",
      "prerequisites": "无",
      "difficulty": "入门",
      "abilities_covered": ["Python基本语法", "数据结构与函数", "文件读写与JSON处理"],
      "readings": [
        {{
          "title": "Python官方教程",
          "url": "https://docs.python.org/zh-cn/3/tutorial/",
          "description": "Python官方入门教程，覆盖基础语法、控制流、数据结构"
        }},
        {{
          "title": "Real Python基础教程",
          "url": "https://realpython.com/python-basics/",
          "description": "免费优质Python教程，包含大量动手练习"
        }}
      ],
      "expected_output": "用Python实现一个命令行待办事项管理器，支持增删改查和数据持久化",
      "project_specs": [
        {{
          "github_search_query": "python beginner project tutorial todo app",
          "difficulty_stars": 2,
          "estimated_time": "3天",
          "why_learn": "通过阅读这个项目的代码结构和模块组织，你将理解Python项目的标准布局、函数封装和基本的错误处理模式",
          "covers_abilities": ["Python基本语法", "数据结构与函数", "文件读写与JSON处理"]
        }},
        {{
          "github_search_query": "python cli tool example best practices",
          "difficulty_stars": 2,
          "estimated_time": "2天",
          "why_learn": "这个CLI工具的代码展示了一个完整命令行的实现，你将学会参数解析、用户输入处理和输出格式化",
          "covers_abilities": ["Python基本语法", "数据结构与函数"]
        }}
      ]
    }},
    {{
      "order": 2,
      "topic": "API调用与数据处理",
      "goal": "能够通过Python调用第三方API获取数据，并用Pandas进行结构化分析",
      "prerequisites": "阶段1",
      "difficulty": "进阶",
      "abilities_covered": ["HTTP请求与API调用", "JSON数据解析", "Pandas数据处理", "数据可视化基础"],
      "readings": [
        {{
          "title": "Requests库官方文档",
          "url": "https://docs.python-requests.org/zh_CN/latest/",
          "description": "Python最流行的HTTP库，API调用必读"
        }},
        {{
          "title": "Pandas入门教程",
          "url": "https://pandas.pydata.org/docs/getting_started/intro_tutorials/",
          "description": "Pandas官方入门教程系列"
        }}
      ],
      "expected_output": "调用一个公开API（如OpenWeatherMap），获取数据后进行清洗、分析和可视化，产出数据分析报告（Jupyter Notebook）",
      "project_specs": [
        {{
          "github_search_query": "python data analysis api project jupyter",
          "difficulty_stars": 3,
          "estimated_time": "5天",
          "why_learn": "通过复现这个数据分析项目的完整流程，你将掌握从API获取数据到产出可视化报告的端到端技能",
          "covers_abilities": ["HTTP请求与API调用", "JSON数据解析", "Pandas数据处理", "数据可视化基础"]
        }}
      ]
    }}
  ],
  "additional_tips": [
    "每个阶段的学习时间建议控制在1-3周，不要贪多嚼不烂",
    "遇到问题时优先查阅官方文档，其次搜索Stack Overflow",
    "每完成一个阶段就把预期产出推到GitHub上，积累作品集"
  ]
}}

=== FIELD DESCRIPTIONS ===

- target_role: Job title (in {output_language})
- role_type: "technical", "non_technical", or "hybrid"
- current_gap_summary: 2-3 sentences on the main skill gaps (in {output_language})
- stages: 5-8 stages in strict dependency order
  - order: Stage number (1, 2, 3...)
  - topic: Stage name (in {output_language}, e.g., "LLM应用开发基础")
  - goal: ONE sentence stating what the learner can do after this stage (in {output_language})
  - prerequisites: "无" for first stage, otherwise list stage numbers (e.g., "阶段1, 阶段2")
  - difficulty: "入门", "进阶", or "高级"
  - abilities_covered: List of specific abilities this stage builds (in {output_language})
  - readings: 2-3 recommended readings
    - title: Reading title
    - url: Direct URL (PRIORITIZE official docs, then authoritative tutorials, then classic papers)
    - description: One-line description (in {output_language})
  - expected_output: A CONCRETE, demonstrable mini-project or exercise (in {output_language}). Must be specific enough to execute immediately.
  - project_specs: 1-3 GitHub project specifications per stage
    - github_search_query: English keywords for GitHub search (e.g., "fastapi microservice example"). Be specific.
    - difficulty_stars: ⭐ rating from 1 (easiest) to 5 (hardest). Be realistic.
    - estimated_time: Time commitment (e.g., "2天", "1周", "3天")
    - why_learn: Write from the LEARNER'S perspective — what specific skills/patterns/concepts will they absorb by studying this project. NOT "this project is popular" but "通过复现这个项目的X逻辑，你将掌握Y技能"
    - covers_abilities: Which abilities from abilities_covered does this project address? List the matching entries exactly.
- additional_tips: 3-5 actionable learning tips (in {output_language})

CRITICAL RULES:
- Output ONLY the JSON object, no markdown code blocks, no surrounding text
- ALL text content MUST be in {output_language} — highest priority
- github_search_query MUST be in English (GitHub search works best with English)
- Stages MUST have clear dependency order — each stage builds on previous ones
- Each stage's expected_output MUST be specific and executable
- why_learn MUST be learner-perspective, not project description
- Reading URLs MUST be real, working links — prioritize official docs
- difficulty_stars MUST be realistic (don't make everything 3 stars)
- role_type MUST be correctly classified"""

JD_COMBINED_ANALYSIS_PROMPT = """You are an expert job market analyst AND career coach. Complete TWO tasks in ONE response.

CRITICAL: ALL text values in the JSON output MUST be in {output_language}. Only keep proper nouns (brand names, product names, technical acronyms, URLs) in their original form.

Output ONLY a valid JSON object with TWO top-level keys: "skills_analysis" and "learning_path". No markdown, no explanations.

=== TASK 1: SKILLS ANALYSIS ===

Analyze the following job descriptions. Extract and aggregate ALL skills, requirements, and patterns.

Job Descriptions:
{job_descriptions}

For skills_analysis, output:
{{
  "summary": "2-3 sentence summary of typical requirements across all JDs",
  "skill_categories": [
    {{
      "category": "category name in {output_language}",
      "skills": ["skill1", "skill2"],
      "importance": "required|preferred|nice-to-have"
    }}
  ],
  "experience_requirements": [
    {{ "description": "e.g. 5年以上后端开发经验", "level": "entry|mid|senior|lead" }}
  ],
  "soft_skills": ["skill1", "skill2"],
  "education_requirements": ["requirement1", "requirement2"],
  "industry_insights": [
    {{ "topic": "trend topic", "detail": "detailed observation" }}
  ],
  "cross_jd_patterns": ["pattern1", "pattern2"]
}}

=== TASK 2: LEARNING PATH ===

Based on the skills analysis you just produced internally, design a staged learning path.

First, classify the target role:
- "technical": 开发/工程师/算法/AI/ML/数据/DevOps/测试/架构/全栈
- "non_technical": 产品/运营/市场/设计/HR/销售/客服/行政
- "hybrid": AI产品经理/AI产品运营/AI解决方案/技术产品经理

For learning_path, output:
{{
  "target_role": "job title in {output_language}",
  "role_type": "technical|non_technical|hybrid",
  "current_gap_summary": "2-3 sentences on main skill gaps in {output_language}",
  "stages": [
    {{
      "order": 1,
      "topic": "stage topic in {output_language}",
      "goal": "what learner can do after this stage in {output_language}",
      "prerequisites": "无 or stage numbers",
      "difficulty": "入门|进阶|高级",
      "abilities_covered": ["ability1", "ability2"],
      "readings": [
        {{
          "title": "reading title",
          "url": "direct URL, prioritize official docs",
          "description": "one-line description in {output_language}"
        }}
      ],
      "expected_output": "concrete demonstrable output in {output_language}",
      "project_specs": [
        {{
          "github_search_query": "English keywords for GitHub search, be specific and add tech stack names",
          "difficulty_stars": 1-5,
          "estimated_time": "e.g. 3天, 1周",
          "why_learn": "learner perspective: what skills/patterns/concepts they gain in {output_language}",
          "covers_abilities": ["matched abilities from abilities_covered"]
        }}
      ]
    }}
  ],
  "additional_tips": ["tip1", "tip2", "tip3"]
}}

=== RULES ===
- Output ONLY the JSON object, no markdown code blocks, no surrounding text
- ALL text content MUST be in {output_language} — highest priority
- github_search_query MUST be in English
- Stages MUST be 5-8 in strict dependency order
- Each stage must have concrete expected_output
- Priorities official docs for readings, use real working URLs
- difficulty_stars MUST be realistic (not everything 3 stars)
- Classify importance correctly: required=most JDs, preferred=some JDs, nice-to-have=occasional
- Be thorough in skills analysis: include every tool/tech mentioned in any JD"""
