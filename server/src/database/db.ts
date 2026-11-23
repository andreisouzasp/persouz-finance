import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = Boolean(process.env.DATABASE_URL);

if (!isProduction) {
    const requiredEnvVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD'];
    const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

    if (missingVars.length > 0) {
        throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missingVars.join(', ')}`);
    }
}

export const pool = isProduction
    ? new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000
      })
    : new Pool({
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: Number(process.env.DB_PORT) || 5432,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000
      });