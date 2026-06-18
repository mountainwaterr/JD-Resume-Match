/**
 * 数据库 CRUD 操作
 *
 * 每张表提供：create / getById / list(分页+排序) / update / delete
 * 所有列表查询默认分页 20 条，按 created_at 倒序
 * 用户认证由 Better Auth 管理，此处仅提供查询
 */

import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from './index';
import {
  user,
  resumes,
  jobDescriptions,
  jdAnalyses,
  matchResults,
  improvements,
  chatConversations,
  chatMessages,
  llmConfigs,
} from './schema';

// ═══════════════════════════════════════════
//  工具：分页参数
// ═══════════════════════════════════════════

const DEFAULT_PAGE_SIZE = 20;

interface Pagination {
  page?: number;
  pageSize?: number;
}

function paginate({ page = 1, pageSize = DEFAULT_PAGE_SIZE }: Pagination) {
  const limit = Math.min(pageSize, 100);
  const offset = (Math.max(page, 1) - 1) * limit;
  return { limit, offset };
}

// ═══════════════════════════════════════════
// 1. user — 用户（Better Auth 管理，此处仅查询）
// ═══════════════════════════════════════════

export async function getUserById(id: string) {
  const [u] = await db.select().from(user).where(eq(user.id, id));
  return u ?? null;
}

export async function getUserByEmail(email: string) {
  const [u] = await db.select().from(user).where(eq(user.email, email));
  return u ?? null;
}

export async function listUsers(p: Pagination = {}) {
  const { limit, offset } = paginate(p);
  const rows = await db
    .select()
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(user);
  return { rows, total: count, page: p.page ?? 1, pageSize: limit };
}

// ═══════════════════════════════════════════
// 2. resumes — 简历
// ═══════════════════════════════════════════

export async function createResume(input: {
  userId: string;
  title?: string;
  originalFilename?: string;
  source?: 'upload' | 'tailored';
  parentId?: string | null;
  isMaster?: boolean;
}) {
  const [resume] = await db
    .insert(resumes)
    .values({
      userId: input.userId,
      title: input.title ?? null,
      originalFilename: input.originalFilename ?? null,
      source: input.source ?? 'upload',
      parentId: input.parentId ?? null,
      isMaster: input.isMaster ?? false,
      processingStatus: 'pending',
    })
    .returning();
  return resume;
}

export async function getResumeById(id: string) {
  const [r] = await db.select().from(resumes).where(eq(resumes.id, id));
  return r ?? null;
}

export async function listResumesByUser(userId: string, p: Pagination = {}) {
  const { limit, offset } = paginate(p);
  const rows = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.createdAt))
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resumes)
    .where(eq(resumes.userId, userId));
  return { rows, total: count, page: p.page ?? 1, pageSize: limit };
}

export async function getMasterResume(userId: string) {
  const [r] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.userId, userId), eq(resumes.isMaster, true)));
  return r ?? null;
}

export async function updateResume(
  id: string,
  input: Partial<{
    title: string;
    contentMarkdown: string | null;
    structuredData: Record<string, unknown> | null;
    processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
    isMaster: boolean;
  }>
) {
  const [r] = await db
    .update(resumes)
    .set({ ...input, updatedAt: sql`now()` })
    .where(eq(resumes.id, id))
    .returning();
  return r ?? null;
}

export async function deleteResume(id: string) {
  const [r] = await db.delete(resumes).where(eq(resumes.id, id)).returning();
  return r ?? null;
}

// ═══════════════════════════════════════════
// 3. job_descriptions — 职位描述
// ═══════════════════════════════════════════

export async function createJobDescription(input: {
  userId?: string | null;
  content: string;
  title?: string;
  source?: string;
}) {
  const [jd] = await db
    .insert(jobDescriptions)
    .values({
      userId: input.userId ?? null,
      content: input.content,
      title: input.title ?? null,
      source: input.source ?? null,
    })
    .returning();
  return jd;
}

export async function getJobDescriptionById(id: string) {
  const [jd] = await db.select().from(jobDescriptions).where(eq(jobDescriptions.id, id));
  return jd ?? null;
}

export async function listJobDescriptionsByUser(userId: string, p: Pagination = {}) {
  const { limit, offset } = paginate(p);
  const rows = await db
    .select()
    .from(jobDescriptions)
    .where(eq(jobDescriptions.userId, userId))
    .orderBy(desc(jobDescriptions.createdAt))
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobDescriptions)
    .where(eq(jobDescriptions.userId, userId));
  return { rows, total: count, page: p.page ?? 1, pageSize: limit };
}

export async function updateJobDescription(
  id: string,
  input: Partial<{ content: string; title: string; source: string }>
) {
  const [jd] = await db
    .update(jobDescriptions)
    .set({ ...input, updatedAt: sql`now()` })
    .where(eq(jobDescriptions.id, id))
    .returning();
  return jd ?? null;
}

export async function deleteJobDescription(id: string) {
  const [jd] = await db.delete(jobDescriptions).where(eq(jobDescriptions.id, id)).returning();
  return jd ?? null;
}

// ═══════════════════════════════════════════
// 4. jd_analyses — JD 分析结果
// ═══════════════════════════════════════════

export async function createJdAnalysis(input: {
  jdIds: string[];
  contentHash: string;
  skillsAnalysis: Record<string, unknown>;
  learningPath: Record<string, unknown>;
  language?: string;
  title?: string;
}) {
  const [analysis] = await db
    .insert(jdAnalyses)
    .values({
      jdIds: input.jdIds as never,
      contentHash: input.contentHash,
      skillsAnalysis: input.skillsAnalysis as never,
      learningPath: input.learningPath as never,
      language: input.language ?? 'zh',
      title: input.title ?? null,
    })
    .returning();
  return analysis;
}

export async function getJdAnalysisById(id: string) {
  const [analysis] = await db.select().from(jdAnalyses).where(eq(jdAnalyses.id, id));
  return analysis ?? null;
}

export async function getJdAnalysisByHash(contentHash: string) {
  const [analysis] = await db
    .select()
    .from(jdAnalyses)
    .where(eq(jdAnalyses.contentHash, contentHash));
  return analysis ?? null;
}

export async function listJdAnalyses(p: Pagination = {}) {
  const { limit, offset } = paginate(p);
  const rows = await db
    .select()
    .from(jdAnalyses)
    .orderBy(desc(jdAnalyses.createdAt))
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(jdAnalyses);
  return { rows, total: count, page: p.page ?? 1, pageSize: limit };
}

export async function deleteJdAnalysis(id: string) {
  const [analysis] = await db.delete(jdAnalyses).where(eq(jdAnalyses.id, id)).returning();
  return analysis ?? null;
}

// ═══════════════════════════════════════════
// 5. match_results — 匹配结果（核心表）
// ═══════════════════════════════════════════

export async function createMatchResult(input: {
  userId: string;
  resumeId: string;
  jdId?: string | null;
  jdAnalysisId?: string | null;
  matchScore?: number;
  keywordScore?: number;
  aiScore?: number;
  skillGaps?: Record<string, unknown>[];
  strengthMatches?: Record<string, unknown>[];
  missingKeywords?: string[];
  changesSummary?: Record<string, unknown>;
  improvedResumeData?: Record<string, unknown>;
  stage?: string;
}) {
  const [result] = await db
    .insert(matchResults)
    .values({
      userId: input.userId,
      resumeId: input.resumeId,
      jdId: input.jdId ?? null,
      jdAnalysisId: input.jdAnalysisId ?? null,
      matchScore: input.matchScore != null ? String(input.matchScore) : null,
      keywordScore: input.keywordScore != null ? String(input.keywordScore) : null,
      aiScore: input.aiScore != null ? String(input.aiScore) : null,
      skillGaps: (input.skillGaps ?? null) as never,
      strengthMatches: (input.strengthMatches ?? null) as never,
      missingKeywords: input.missingKeywords ?? null,
      changesSummary: (input.changesSummary ?? null) as never,
      improvedResumeData: (input.improvedResumeData ?? null) as never,
      stage: input.stage ?? 'analyzing',
    })
    .returning();
  return result;
}

export async function getMatchResultById(id: string) {
  const [result] = await db.select().from(matchResults).where(eq(matchResults.id, id));
  return result ?? null;
}

export async function listMatchResultsByUser(userId: string, p: Pagination = {}) {
  const { limit, offset } = paginate(p);
  const rows = await db
    .select()
    .from(matchResults)
    .where(eq(matchResults.userId, userId))
    .orderBy(desc(matchResults.createdAt))
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matchResults)
    .where(eq(matchResults.userId, userId));
  return { rows, total: count, page: p.page ?? 1, pageSize: limit };
}

export async function updateMatchResult(
  id: string,
  input: Partial<{
    matchScore: number;
    aiScore: number;
    tailoredResumeId: string | null;
    changesSummary: Record<string, unknown>;
    improvedResumeData: Record<string, unknown>;
    stage: string;
  }>
) {
  const setData: Record<string, unknown> = { updatedAt: sql`now()` };
  if (input.matchScore != null) setData.matchScore = String(input.matchScore);
  if (input.aiScore != null) setData.aiScore = String(input.aiScore);
  if (input.tailoredResumeId !== undefined) setData.tailoredResumeId = input.tailoredResumeId;
  if (input.changesSummary !== undefined) setData.changesSummary = input.changesSummary;
  if (input.improvedResumeData !== undefined) setData.improvedResumeData = input.improvedResumeData;
  if (input.stage !== undefined) setData.stage = input.stage;
  const [result] = await db
    .update(matchResults)
    .set(setData)
    .where(eq(matchResults.id, id))
    .returning();
  return result ?? null;
}

export async function deleteMatchResult(id: string) {
  const [result] = await db.delete(matchResults).where(eq(matchResults.id, id)).returning();
  return result ?? null;
}

// ═══════════════════════════════════════════
// 6. improvements — 简历改进明细
// ═══════════════════════════════════════════

export async function createImprovement(input: {
  matchResultId: string;
  originalResumeId: string;
  tailoredResumeId?: string | null;
  changeType: 'added' | 'removed' | 'modified';
  fieldPath?: string;
  fieldType?:
    | 'skill'
    | 'description'
    | 'summary'
    | 'certification'
    | 'experience'
    | 'education'
    | 'project';
  section?: string;
  originalValue?: string;
  newValue?: string;
  reason?: string;
  sortOrder?: number;
}) {
  const [imp] = await db
    .insert(improvements)
    .values({
      matchResultId: input.matchResultId,
      originalResumeId: input.originalResumeId,
      tailoredResumeId: input.tailoredResumeId ?? null,
      changeType: input.changeType,
      fieldPath: input.fieldPath ?? null,
      fieldType: input.fieldType ?? null,
      section: input.section ?? null,
      originalValue: input.originalValue ?? null,
      newValue: input.newValue ?? null,
      reason: input.reason ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return imp;
}

export async function listImprovementsByMatch(matchResultId: string) {
  return db
    .select()
    .from(improvements)
    .where(eq(improvements.matchResultId, matchResultId))
    .orderBy(improvements.sortOrder);
}

export async function updateImprovementDecision(
  id: string,
  input: { isAccepted: boolean; userModifiedValue?: string | null }
) {
  const [imp] = await db
    .update(improvements)
    .set({
      isAccepted: input.isAccepted,
      userModifiedValue: input.userModifiedValue ?? null,
      updatedAt: sql`now()`,
    })
    .where(eq(improvements.id, id))
    .returning();
  return imp ?? null;
}

// ═══════════════════════════════════════════
// 7. chat_conversations — AI 对话会话
// ═══════════════════════════════════════════

export async function createConversation(input: {
  userId: string;
  title?: string;
  contextType?: 'general' | 'resume' | 'jd' | 'match';
  contextId?: string | null;
  contextSnapshot?: Record<string, unknown>;
}) {
  const [conv] = await db
    .insert(chatConversations)
    .values({
      userId: input.userId,
      title: input.title ?? null,
      contextType: input.contextType ?? 'general',
      contextId: input.contextId ?? null,
      contextSnapshot: (input.contextSnapshot ?? null) as never,
    })
    .returning();
  return conv;
}

export async function getConversationById(id: string) {
  const [conv] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
  return conv ?? null;
}

export async function listConversationsByUser(userId: string, p: Pagination = {}) {
  const { limit, offset } = paginate(p);
  const rows = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.userId, userId))
    .orderBy(desc(chatConversations.updatedAt))
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatConversations)
    .where(eq(chatConversations.userId, userId));
  return { rows, total: count, page: p.page ?? 1, pageSize: limit };
}

export async function deleteConversation(id: string) {
  const [conv] = await db.delete(chatConversations).where(eq(chatConversations.id, id)).returning();
  return conv ?? null;
}

// ═══════════════════════════════════════════
// 8. chat_messages — AI 对话消息
// ═══════════════════════════════════════════

export async function createMessage(input: {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  tokenCount?: number;
  model?: string;
}) {
  const [message] = await db.transaction(async (tx) => {
    const [msg] = await tx
      .insert(chatMessages)
      .values({
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        tokenCount: input.tokenCount ?? null,
        model: input.model ?? null,
      })
      .returning();
    await tx
      .update(chatConversations)
      .set({
        messageCount: sql`${chatConversations.messageCount} + 1`,
        updatedAt: sql`now()`,
      })
      .where(eq(chatConversations.id, input.conversationId));
    return [msg];
  });
  return message;
}

export async function listMessagesByConversation(conversationId: string) {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);
}

// ═══════════════════════════════════════════
// 9. llm_configs — LLM 配置
// ═══════════════════════════════════════════

export async function upsertLlmConfig(input: {
  userId: string;
  provider: 'openai' | 'anthropic' | 'deepseek' | 'gemini' | 'openrouter' | 'ollama';
  model: string;
  apiKey: string;
  apiBase?: string;
  temperature?: number;
  maxTokens?: number;
  isActive?: boolean;
}) {
  const [config] = await db
    .insert(llmConfigs)
    .values({
      userId: input.userId,
      provider: input.provider,
      model: input.model,
      apiKey: input.apiKey,
      apiBase: input.apiBase ?? null,
      temperature: input.temperature != null ? String(input.temperature) : '0.70',
      maxTokens: input.maxTokens ?? 4096,
      isActive: input.isActive ?? true,
    })
    .onConflictDoUpdate({
      target: [llmConfigs.userId, llmConfigs.provider],
      set: {
        model: input.model,
        apiKey: input.apiKey,
        apiBase: input.apiBase ?? null,
        temperature: input.temperature != null ? String(input.temperature) : undefined,
        maxTokens: input.maxTokens,
        isActive: input.isActive ?? true,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  return config;
}

export async function listLlmConfigsByUser(userId: string) {
  return db.select().from(llmConfigs).where(eq(llmConfigs.userId, userId));
}

export async function getActiveLlmConfig(userId: string) {
  const [config] = await db
    .select()
    .from(llmConfigs)
    .where(and(eq(llmConfigs.userId, userId), eq(llmConfigs.isActive, true)));
  return config ?? null;
}

export async function updateLlmHealth(id: string, isHealthy: boolean) {
  const [config] = await db
    .update(llmConfigs)
    .set({ isHealthy, lastTestedAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(llmConfigs.id, id))
    .returning();
  return config ?? null;
}

export async function deleteLlmConfig(id: string) {
  const [config] = await db.delete(llmConfigs).where(eq(llmConfigs.id, id)).returning();
  return config ?? null;
}
