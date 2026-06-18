import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  boolean,
  jsonb,
  timestamp,
  integer,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ═══════════════════════════════════════════
// 枚举
// ═══════════════════════════════════════════

/** 简历处理状态：pending→processing→ready/failed */
export const processingStatusEnum = pgEnum('processing_status', [
  'pending',
  'processing',
  'ready',
  'failed',
]);

/** AI 服务提供商 */
export const llmProviderEnum = pgEnum('llm_provider', [
  'openai',
  'anthropic',
  'deepseek',
  'gemini',
  'openrouter',
  'ollama',
]);

/** 对话消息角色 */
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

/** 简历优化改动的类型 */
export const changeTypeEnum = pgEnum('change_type', ['added', 'removed', 'modified']);

/** 简历优化改动的字段类型 */
export const fieldTypeEnum = pgEnum('field_type', [
  'skill',
  'description',
  'summary',
  'certification',
  'experience',
  'education',
  'project',
]);

/** 简历来源 */
export const resumeSourceEnum = pgEnum('resume_source', ['upload', 'tailored']);

/** AI对话上下文类型 */
export const contextTypeEnum = pgEnum('context_type', ['general', 'resume', 'jd', 'match']);

// ═══════════════════════════════════════════
// 1. Better Auth — 用户 & 认证表
// ═══════════════════════════════════════════

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

// ═══════════════════════════════════════════
// 2. resumes — 简历表
// ═══════════════════════════════════════════

export const resumes = pgTable(
  'resumes',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // 归属
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    // 基本信息
    title: varchar('title', { length: 200 }),
    originalFilename: varchar('original_filename', { length: 500 }),
    source: resumeSourceEnum('source').default('upload').notNull(),

    // 版本链：定制简历的 parent_id 指向原始简历
    parentId: uuid('parent_id'),

    // 内容
    contentMarkdown: text('content_markdown'), // 解析后的 Markdown 原文
    structuredData: jsonb('structured_data'), // AI 解析的结构化 JSON（ResumeData）

    // 状态
    processingStatus: processingStatusEnum('processing_status').default('pending').notNull(),
    isMaster: boolean('is_master').default(false), // 是否主简历（用户的基础模板）

    // 时间戳
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_resumes_user_id').on(table.userId),
    parentIdIdx: index('idx_resumes_parent_id').on(table.parentId),
    statusIdx: index('idx_resumes_status').on(table.processingStatus),
    createdAtIdx: index('idx_resumes_created_at').on(table.createdAt),
  })
);

// ═══════════════════════════════════════════
// 3. job_descriptions — 职位描述表
// ═══════════════════════════════════════════

export const jobDescriptions = pgTable(
  'job_descriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // 归属
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),

    // 内容
    content: text('content').notNull(), // JD 完整文本
    title: varchar('title', { length: 300 }), // 从 JD 提取的职位名称（如"高级后端工程师"）
    source: varchar('source', { length: 100 }), // 来源：manual / url

    // 时间戳
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_jd_user_id').on(table.userId),
    createdAtIdx: index('idx_jd_created_at').on(table.createdAt),
  })
);

// ═══════════════════════════════════════════
// 4. jd_analyses — JD 分析结果表
// ═══════════════════════════════════════════

export const jdAnalyses = pgTable(
  'jd_analyses',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // 关联的 JD ID 列表（JSON 数组，避免多对多中间表）
    jdIds: jsonb('jd_ids').notNull(),

    // 缓存：相同 JD 集合的 SHA256，命中后直接返回缓存
    contentHash: varchar('content_hash', { length: 64 }).notNull().unique(),

    // Phase 1 结果：技能分析
    skillsAnalysis: jsonb('skills_analysis').notNull(),

    // Phase 2 结果：学习路径
    learningPath: jsonb('learning_path').notNull(),

    // 元信息
    language: varchar('language', { length: 10 }).default('zh'),
    title: varchar('title', { length: 100 }), // summary 截取前 80 字符

    // 时间戳
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    hashIdx: uniqueIndex('idx_jd_analysis_hash').on(table.contentHash),
    createdAtIdx: index('idx_jd_analysis_created_at').on(table.createdAt),
  })
);

// ═══════════════════════════════════════════
// 5. match_results — 匹配结果表（核心）
// ═══════════════════════════════════════════

export const matchResults = pgTable(
  'match_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // 关联
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    resumeId: uuid('resume_id') // 原始简历
      .notNull()
      .references(() => resumes.id, { onDelete: 'cascade' }),
    jdId: uuid('jd_id') // JD
      .references(() => jobDescriptions.id, { onDelete: 'set null' }),
    jdAnalysisId: uuid('jd_analysis_id') // JD 分析结果
      .references(() => jdAnalyses.id, { onDelete: 'set null' }),
    tailoredResumeId: uuid('tailored_resume_id') // 定制后的简历
      .references(() => resumes.id, { onDelete: 'set null' }),

    // 匹配评分（0-100）
    matchScore: decimal('match_score', { precision: 5, scale: 1 }), // 综合匹配度
    keywordScore: decimal('keyword_score', { precision: 5, scale: 1 }), // 关键词匹配分
    aiScore: decimal('ai_score', { precision: 5, scale: 1 }), // AI 语义评分

    // 差距分析
    skillGaps: jsonb('skill_gaps'),
    strengthMatches: jsonb('strength_matches'), // 简历已具备的 JD 技能
    missingKeywords: jsonb('missing_keywords'), // 缺失的关键词

    // 优化摘要
    changesSummary: jsonb('changes_summary'),

    // 优化后的完整简历数据（JSON，用于预览和确认）
    improvedResumeData: jsonb('improved_resume_data'),

    // 流程阶段
    stage: varchar('stage', { length: 20 }).default('analyzing'),

    // 时间戳
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_match_user_id').on(table.userId),
    resumeIdIdx: index('idx_match_resume_id').on(table.resumeId),
    createdAtIdx: index('idx_match_created_at').on(table.createdAt),
    userCreatedIdx: index('idx_match_user_created').on(table.userId, table.createdAt),
  })
);

// ═══════════════════════════════════════════
// 6. improvements — 简历改进明细表
// ═══════════════════════════════════════════

export const improvements = pgTable(
  'improvements',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    matchResultId: uuid('match_result_id')
      .notNull()
      .references(() => matchResults.id, { onDelete: 'cascade' }),
    originalResumeId: uuid('original_resume_id')
      .notNull()
      .references(() => resumes.id, { onDelete: 'cascade' }),
    tailoredResumeId: uuid('tailored_resume_id').references(() => resumes.id, {
      onDelete: 'set null',
    }),

    changeType: changeTypeEnum('change_type').notNull(),
    fieldPath: varchar('field_path', { length: 200 }),
    fieldType: fieldTypeEnum('field_type'),
    section: varchar('section', { length: 100 }),

    originalValue: text('original_value'),
    newValue: text('new_value'),
    reason: varchar('reason', { length: 500 }),

    isAccepted: boolean('is_accepted'),
    userModifiedValue: text('user_modified_value'),

    sortOrder: integer('sort_order').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    matchResultIdx: index('idx_improve_match').on(table.matchResultId),
    typeIdx: index('idx_improve_type').on(table.changeType),
  })
);

// ═══════════════════════════════════════════
// 7. chat_conversations — AI 对话会话表
// ═══════════════════════════════════════════

export const chatConversations = pgTable(
  'chat_conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    title: varchar('title', { length: 200 }),

    contextType: contextTypeEnum('context_type').default('general'),
    contextId: uuid('context_id'),
    contextSnapshot: jsonb('context_snapshot'),

    messageCount: integer('message_count').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_chat_conv_user').on(table.userId),
    contextIdx: index('idx_chat_conv_context').on(table.contextType, table.contextId),
    updatedAtIdx: index('idx_chat_conv_updated').on(table.updatedAt),
  })
);

// ═══════════════════════════════════════════
// 8. chat_messages — AI 对话消息表
// ═══════════════════════════════════════════

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => chatConversations.id, { onDelete: 'cascade' }),

    role: messageRoleEnum('role').notNull(),
    content: text('content').notNull(),

    tokenCount: integer('token_count'),
    model: varchar('model', { length: 100 }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    convIdIdx: index('idx_chat_msg_conv').on(table.conversationId),
    convCreatedIdx: index('idx_chat_msg_conv_created').on(table.conversationId, table.createdAt),
  })
);

// ═══════════════════════════════════════════
// 9. llm_configs — LLM 配置表
// ═══════════════════════════════════════════

export const llmConfigs = pgTable(
  'llm_configs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),

    provider: llmProviderEnum('provider').notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    apiKey: varchar('api_key', { length: 500 }).notNull(),
    apiBase: varchar('api_base', { length: 500 }),

    temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.70'),
    maxTokens: integer('max_tokens').default(4096),
    reasoningEffort: varchar('reasoning_effort', { length: 50 }),

    isActive: boolean('is_active').default(false),
    isHealthy: boolean('is_healthy'),
    lastTestedAt: timestamp('last_tested_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdProviderIdx: uniqueIndex('idx_llm_user_provider').on(table.userId, table.provider),
  })
);

// ═══════════════════════════════════════════
// Drizzle Relations（类型安全的关联查询）
// ═══════════════════════════════════════════

export const userRelations = relations(user, ({ many }) => ({
  resumes: many(resumes),
  jobDescriptions: many(jobDescriptions),
  chatConversations: many(chatConversations),
  llmConfigs: many(llmConfigs),
  matchResults: many(matchResults),
  sessions: many(session),
  accounts: many(account),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(user, { fields: [resumes.userId], references: [user.id] }),
  parent: one(resumes, {
    fields: [resumes.parentId],
    references: [resumes.id],
    relationName: 'parentResume',
  }),
  children: many(resumes, { relationName: 'parentResume' }),
  matchResultsAsOriginal: many(matchResults, { relationName: 'originalResume' }),
  matchResultsAsTailored: many(matchResults, { relationName: 'tailoredResume' }),
  improvementsAsOriginal: many(improvements, { relationName: 'originalResume' }),
}));

export const jobDescriptionsRelations = relations(jobDescriptions, ({ one, many }) => ({
  user: one(user, { fields: [jobDescriptions.userId], references: [user.id] }),
  matchResults: many(matchResults),
}));

export const matchResultsRelations = relations(matchResults, ({ one, many }) => ({
  user: one(user, { fields: [matchResults.userId], references: [user.id] }),
  resume: one(resumes, {
    fields: [matchResults.resumeId],
    references: [resumes.id],
    relationName: 'originalResume',
  }),
  tailoredResume: one(resumes, {
    fields: [matchResults.tailoredResumeId],
    references: [resumes.id],
    relationName: 'tailoredResume',
  }),
  jd: one(jobDescriptions, {
    fields: [matchResults.jdId],
    references: [jobDescriptions.id],
  }),
  jdAnalysis: one(jdAnalyses, {
    fields: [matchResults.jdAnalysisId],
    references: [jdAnalyses.id],
  }),
  improvements: many(improvements),
}));

export const improvementsRelations = relations(improvements, ({ one }) => ({
  matchResult: one(matchResults, {
    fields: [improvements.matchResultId],
    references: [matchResults.id],
  }),
  originalResume: one(resumes, {
    fields: [improvements.originalResumeId],
    references: [resumes.id],
    relationName: 'originalResume',
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(user, {
    fields: [chatConversations.userId],
    references: [user.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
}));
