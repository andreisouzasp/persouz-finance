import { pool } from '../database/db.js';
import { type Transaction } from '../interfaces/Transaction.js';

export async function findAllTransactionsByUser(userId: number): Promise<Transaction[]> {
    const result = await pool.query<Transaction>(
        `SELECT
            t.id,
            t.description,
            t.value::float AS value,
            t.type,
            c.name AS category,
            TO_CHAR(t.date, 'YYYY-MM-DD') AS date
         FROM transactions t
         INNER JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1
         ORDER BY t.date DESC, t.id DESC`,
        [userId]
    );
    return result.rows;
}

export async function createTransaction(
    userId: number,
    categoryId: number,
    description: string,
    value: number,
    type: 'income' | 'expense',
    date: string
): Promise<Omit<Transaction, 'category'> | null> {
    const result = await pool.query<Omit<Transaction, 'category'>>(
        `INSERT INTO transactions (user_id, category_id, description, value, type, date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, description, value::float AS value, type, TO_CHAR(date, 'YYYY-MM-DD') AS date`,
        [userId, categoryId, description, value, type, date]
    );
    return result.rows[0] ?? null;
}

export async function updateTransaction(
    id: number,
    userId: number,
    description: string,
    value: number,
    type: 'income' | 'expense',
    categoryId: number,
    date: string
): Promise<Omit<Transaction, 'category'> | null> {
    const result = await pool.query<Omit<Transaction, 'category'>>(
        `UPDATE transactions t
         SET description = $1,
             value = $2,
             type = $3,
             category_id = $4,
             date = $5
         WHERE t.id = $6
           AND t.user_id = $7
         RETURNING
             t.id,
             t.description,
             t.value::float AS value,
             t.type,
             TO_CHAR(t.date, 'YYYY-MM-DD') AS date`,
        [description, value, type, categoryId, date, id, userId]
    );
    return result.rows[0] ?? null;
}

export async function deleteTransaction(id: number, userId: number): Promise<Transaction | null> {
    const result = await pool.query<Transaction>(
        `DELETE FROM transactions t
         USING categories c
         WHERE t.id = $1
           AND t.user_id = $2
           AND t.category_id = c.id
         RETURNING
             t.id,
             t.description,
             t.value::float AS value,
             t.type,
             c.name AS category,
             TO_CHAR(t.date, 'YYYY-MM-DD') AS date`,
        [id, userId]
    );
    return result.rows[0] ?? null;
}