import express, { type Request, type Response } from 'express';
import { type Transaction } from './interfaces/Transaction.js';
import { type Category } from './interfaces/Category.js';
import cors from 'cors';
import { pool } from './database/db.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.json({ mensagem: 'API do Persouz Finance operante!' });
});

app.get('/transactions', async (req: Request, res: Response) => {
    try {
        const userId = 1;
        const query = `
            SELECT
                t.id,
                t.description,
                t.value::float AS value,
                t.type,
                c.name AS category,
                TO_CHAR(t.date, 'YYYY-MM-DD') AS date
            FROM transactions t
            INNER JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1
            ORDER BY t.date DESC, t.id DESC
        `;

        const result = await pool.query<Transaction>(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        res.status(500).json({ erro: 'Erro interno ao buscar transações.' });
    }
});

app.post('/transactions', async (req: Request, res: Response) => {
    const { description, value, type, category, date } = req.body;

    if (!validateTransactionPayload(req.body)) {
        res.status(400).json({ erro: 'Dados da transação inválidos ou incompletos.' });
        return;
    }

    try {
        const userId = 1;
        const categoryId = await findCategoryId(category, type, userId);

        if (!categoryId) {
            res.status(400).json({ erro: `Categoria '${category}' não encontrada no banco.` });
            return;
        }

        const insertQuery = `
            INSERT INTO transactions (user_id, category_id, description, value, type, date)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, description, value::float AS value, type, TO_CHAR(date, 'YYYY-MM-DD') AS date
        `;

        const result = await pool.query(insertQuery, [
            userId,
            categoryId,
            description.trim(),
            value,
            type,
            date
        ]);

        res.status(201).json({ ...result.rows[0], category });
    } catch (error) {
        console.error('Erro ao criar transação:', error);
        res.status(500).json({ erro: 'Erro interno ao salvar transação.' });
    }
});

app.put('/transactions/:id', async (req: Request, res: Response) => {
    const { description, value, type, category, date } = req.body;
    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
        res.status(400).json({ erro: 'ID da transação inválido.' });
        return;
    }

    if (!validateTransactionPayload(req.body)) {
        res.status(400).json({ erro: 'Dados da transação inválidos ou incompletos.' });
        return;
    }

    try {
        const userId = 1;
        const categoryId = await findCategoryId(category, type, userId);

        if (!categoryId) {
            res.status(400).json({ erro: `Categoria '${category}' não encontrada no banco.` });
            return;
        }

        const result = await pool.query(
            `
                UPDATE transactions t
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
                    TO_CHAR(t.date, 'YYYY-MM-DD') AS date
            `,
            [description.trim(), value, type, categoryId, date, id, userId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ erro: 'Transação não encontrada.' });
            return;
        }

        res.status(200).json({
            ...result.rows[0],
            category,
        });
    } catch (error) {
        console.error('Erro ao atualizar transação:', error);
        res.status(500).json({ erro: 'Erro interno ao atualizar transação.' });
    }
});

app.delete('/transactions/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
        res.status(400).json({ erro: 'ID da transação inválido.' });
        return;
    }

    try {
        const userId = 1;

        const result = await pool.query(
            `
                DELETE FROM transactions t
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
                    TO_CHAR(t.date, 'YYYY-MM-DD') AS date
            `,
            [id, userId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ erro: 'Transação não encontrada.' });
            return;
        }

        res.status(200).json({
            mensagem: 'Transação removida com sucesso.',
            transaction: result.rows[0],
        });
    } catch (error) {
        console.error('Erro ao excluir transação:', error);
        res.status(500).json({ erro: 'Erro interno ao excluir transação.' });
    }
});

app.get('/categories', async (req: Request, res: Response) => {
    try {
        const userId = 1;
        const query = `
            SELECT id, name, type, user_id, icon, color
            FROM categories
            WHERE user_id IS NULL OR user_id = $1
            ORDER BY user_id NULLS FIRST, id ASC
        `;

        const result = await pool.query<Category>(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({ erro: 'Erro interno ao buscar categorias.' });
    }
});

app.post('/categories', async (req: Request, res: Response) => {
    const { name, type, icon, color } = req.body;

    if (!validateCategoryPayload(req.body)) {
        res.status(400).json({ erro: 'Nome ou tipo da categoria inválidos.' });
        return;
    }

    try {
        const userId = 1;
        const cleanName = name.trim();
        const categoryIcon = typeof icon === 'string' && icon.trim() ? icon.trim() : 'fa-tag';
        const categoryColor = typeof color === 'string' && color.trim() ? color.trim() : '#94a3b8';

        const duplicateCheck = await pool.query(
            `SELECT id FROM categories 
             WHERE LOWER(name) = LOWER($1) 
               AND type = $2 
               AND (user_id = $3 OR user_id IS NULL)`,
            [cleanName, type, userId]
        );

        if (duplicateCheck.rows.length > 0) {
            res.status(409).json({ erro: 'Já existe uma categoria com este nome para este tipo.' });
            return;
        }

        const insertQuery = `
            INSERT INTO categories (name, type, user_id, icon, color)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, type, user_id, icon, color
        `;

        const result = await pool.query<Category>(insertQuery, [
            cleanName,
            type,
            userId,
            categoryIcon,
            categoryColor
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ erro: 'Erro interno ao salvar categoria.' });
    }
});

app.put('/categories/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { name, type, icon, color } = req.body;

    if (isNaN(id) || id <= 0) {
        res.status(400).json({ erro: 'ID da categoria inválido.' });
        return;
    }

    if (!validateCategoryPayload(req.body)) {
        res.status(400).json({ erro: 'Nome ou tipo da categoria inválidos.' });
        return;
    }

    try {
        const userId = 1;
        const cleanName = name.trim();

        const duplicateCheck = await pool.query(
            `SELECT id FROM categories
             WHERE LOWER(name) = LOWER($1)
               AND type = $2
               AND id <> $3
               AND (user_id = $4 OR user_id IS NULL)`,
            [cleanName, type, id, userId]
        );

        if (duplicateCheck.rows.length > 0) {
            res.status(409).json({ erro: 'Já existe uma categoria com este nome para este tipo.' });
            return;
        }

        const result = await pool.query<Category>(
            `UPDATE categories
            SET name = $1,
                type = $2,
                icon = COALESCE($3, icon),
                color = COALESCE($4, color)
            WHERE id = $5
            AND user_id = $6
            RETURNING id, name, type, user_id, icon, color`,
            [cleanName, type, icon ?? null, color ?? null, id, userId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ erro: 'Categoria não encontrada ou não pode ser editada.' });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ erro: 'Erro interno ao atualizar categoria.' });
    }
});

app.delete('/categories/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
        res.status(400).json({ erro: 'ID da categoria inválido.' });
        return;
    }

    try {
        const userId = 1;
        const result = await pool.query<Category>(
            `DELETE FROM categories
             WHERE id = $1 AND user_id = $2
             RETURNING id, name, type, user_id, icon, color`,
            [id, userId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ erro: 'Categoria não encontrada ou não pode ser removida.' });
            return;
        }

        res.status(200).json({
            mensagem: 'Categoria removida com sucesso.',
            category: result.rows[0]
        });
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23503') {
            res.status(409).json({ erro: 'Não é possível excluir uma categoria que possui transações vinculadas.' });
            return;
        }

        console.error('Erro ao excluir categoria:', error);
        res.status(500).json({ erro: 'Erro interno ao excluir categoria.' });
    }
});

app.listen(3000, async () => {
    console.log('Servidor do Persouz Finance rodando na porta 3000!');

    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Conectado ao PostgreSQL com sucesso! Hora do banco:', res.rows[0].now);
    } catch (error) {
        console.error('Erro ao conectar no PostgreSQL:', error);
    }
});

function validateTransactionPayload(payload: Record<string, unknown>): boolean {
    const { description, value, type, category, date } = payload;

    const isValidDescription = typeof description === 'string' && description.trim().length > 0;
    const isValidValue = typeof value === 'number' && !Number.isNaN(value) && value > 0;
    const isValidType = type === 'income' || type === 'expense';
    const isValidCategory = typeof category === 'string' && category.trim().length > 0;
    const isValidDate = typeof date === 'string' && date.trim().length > 0;

    return isValidDescription && isValidValue && isValidType && isValidCategory && isValidDate;
}

function validateCategoryPayload(payload: Record<string, unknown>): boolean {
    const { name, type } = payload;

    const isValidName = typeof name === 'string' && name.trim().length > 0;
    const isValidType = type === 'income' || type === 'expense';

    return isValidName && isValidType;
}

async function findCategoryId(name: string, type: string, userId: number): Promise<number | null> {
    const result = await pool.query(
        `SELECT id FROM categories 
        WHERE name = $1 
        AND type = $2 
        AND (user_id = $3 OR user_id IS NULL)`,
        [name, type, userId]
    );
    return result.rows[0]?.id ?? null;
}