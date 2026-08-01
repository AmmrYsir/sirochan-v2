import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || (import.meta as any).env?.DATABASE_URL;

if (!connectionString) {
  throw new Error('[Database Error] DATABASE_URL environment variable is missing. Please set DATABASE_URL in your .env file.');
}

const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
