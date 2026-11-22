import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
} = process.env;

if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    throw new Error('Configuração do PostgreSQL incompleta. Verifique as variáveis DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME.');
}

const port = Number(DB_PORT);

if (!Number.isInteger(port) || port <= 0) {
    throw new Error('DB_PORT deve ser um número inteiro válido.');
}

export const pool = new Pool({
    host: DB_HOST,
    port,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});