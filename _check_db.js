const postgres = require('postgres');

async function main() {
  const sql = postgres('postgresql://neondb_owner:npg_WIMyXKJFA98L@ep-muddy-cell-aog2rxec.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require', { connect_timeout: 15 });
  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
    console.log('Tables:', JSON.stringify(tables, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sql.end();
  }
}

main();
