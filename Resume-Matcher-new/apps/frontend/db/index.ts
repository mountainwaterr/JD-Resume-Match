import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL 未设置，请在 .env 中配置 PostgreSQL 连接字符串');
}

// Postgres.js 客户端
const isProduction = process.env.NODE_ENV === 'production';

const client = postgres(connectionString, {
  max: isProduction ? 5 : 10,
  idle_timeout: 30,
  connect_timeout: 10,
  ...(connectionString.includes('neon.tech') ? { ssl: 'require' } : {}),
});

export const db = drizzle(client, { schema });

export type DbClient = typeof db;

// Serverless 环境下优雅关闭
export async function closeDb() {
  await client.end();
}
