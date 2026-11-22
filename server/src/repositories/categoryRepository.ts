import { pool } from '../database/db.js';
import { type Category } from '../interfaces/Category.js';

export async function findAllCategoriesByUser(userId: number): Promise<Category[]> {
    const result = await pool.query<Category>(
        `SELECT id, name, type, user_id, icon, color
         FROM categories
         WHERE user_id IS NULL OR user_id = $1
         ORDER BY user_id NULLS FIRST, id ASC`,
        [userId]
    );
    return result.rows;
}

export async function findCategoryId(name: string, type: string, userId: number): Promise<number | null> {
    const result = await pool.query<{ id: number }>(
        `SELECT id FROM categories
         WHERE name = $1
           AND type = $2
           AND (user_id = $3 OR user_id IS NULL)`,
        [name, type, userId]
    );
    return result.rows[0]?.id ?? null;
}

export async function hasDuplicateCategory(
    name: string,
    type: string,
    userId: number,
    excludeId?: number
): Promise<boolean> {
    if (excludeId !== undefined) {
        const result = await pool.query(
            `SELECT id FROM categories
             WHERE LOWER(name) = LOWER($1)
               AND type = $2
               AND id <> $3
               AND (user_id = $4 OR user_id IS NULL)`,
            [name, type, excludeId, userId]
        );
        return result.rows.length > 0;
    }

    const result = await pool.query(
        `SELECT id FROM categories
         WHERE LOWER(name) = LOWER($1)
           AND type = $2
           AND (user_id = $3 OR user_id IS NULL)`,
        [name, type, userId]
    );
    return result.rows.length > 0;
}

export async function createCategory(
    name: string,
    type: 'income' | 'expense',
    userId: number,
    icon: string,
    color: string
): Promise<Category | null> {
    const result = await pool.query<Category>(
        `INSERT INTO categories (name, type, user_id, icon, color)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, type, user_id, icon, color`,
        [name, type, userId, icon, color]
    );
    return result.rows[0] ?? null;
}

export async function updateCategory(
    id: number,
    userId: number,
    name: string,
    type: 'income' | 'expense',
    icon: string | null,
    color: string | null
): Promise<Category | null> {
    const result = await pool.query<Category>(
        `UPDATE categories
         SET name = $1,
             type = $2,
             icon = COALESCE($3, icon),
             color = COALESCE($4, color)
         WHERE id = $5
           AND user_id = $6
         RETURNING id, name, type, user_id, icon, color`,
        [name, type, icon, color, id, userId]
    );
    return result.rows[0] ?? null;
}

export async function deleteCategory(id: number, userId: number): Promise<Category | null> {
    const result = await pool.query<Category>(
        `DELETE FROM categories
         WHERE id = $1 AND user_id = $2
         RETURNING id, name, type, user_id, icon, color`,
        [id, userId]
    );
    return result.rows[0] ?? null;
}