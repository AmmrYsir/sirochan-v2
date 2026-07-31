import { defineConfig } from 'drizzle-kit';

const dbPort = process.env.DB_PORT || '5432';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || `postgresql://sirochan:sirochan_secret@localhost:${dbPort}/sirochan_db`
  }
});
