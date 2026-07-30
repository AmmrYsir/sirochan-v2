import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://sirochan:sirochan_secret@localhost:5432/sirochan_db';

const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
