import { pool } from '../database/db.js';
import { type User, type PublicUser } from '../interfaces/User.js';

export async function findUserIdByEmail(email: string): Promise<number | null> {
    const result = await pool.query<{ id: number }>(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
        [email]
    );
    return result.rows[0]?.id ?? null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
        'SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
        [email]
    );
    return result.rows[0] ?? null;
}

export async function createUser(name: string, email: string, passwordHash: string): Promise<PublicUser | null> {
    const result = await pool.query<PublicUser>(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email`,
        [name, email, passwordHash]
    );
    return result.rows[0] ?? null;
}