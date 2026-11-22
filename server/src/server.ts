/* ==========================================================================
   PERSOUZ FINANCE - SUMÁRIO (TABLE OF CONTENTS)
   ==========================================================================
   1. Configuração e Inicialização
   2. Autenticação e Usuários
   3. Transações
   4. Categorias
   5. Validações e Middlewares
   ========================================================================== */

/* ==========================================================================
   1. Configuração e Inicialização
   ========================================================================== */
import express, { type Request, type Response, type NextFunction } from 'express';
import { type Transaction } from './interfaces/Transaction.js';
import { type Category } from './interfaces/Category.js';
import { type User, type PublicUser } from './interfaces/User.js';
import cors from 'cors';
import { pool } from './database/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    userId?: number;
}

interface TokenPayload {
    id: number;
    name: string;
    email: string;
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.json({ mensagem: 'API do Persouz Finance operante!' });
});

const JWT_SECRET = process.env.JWT_SECRET || 'chave_fallback_desenvolvimento';

/* ==========================================================================
   2. Autenticação e Usuários
   ========================================================================== */

app.post('/auth/register', async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!validateRegisterPayload(req.body)) {
        res.status(400).json({ erro: 'Preencha nome, e-mail válido e senha com pelo menos 6 caracteres.' });
        return;
    }

    try {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        // Verifica se o e-mail já está cadastrado
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
            [cleanEmail]
        );

        if (existingUser.rows.length > 0) {
            res.status(409).json({ erro: 'Este e-mail já está em uso.' });
            return;
        }

        // Gera o hash seguro da senha (custo 10)
        const passwordHash = await bcrypt.hash(password, 10);

        const insertQuery = `
            INSERT INTO users (name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, name, email
        `;

        const result = await pool.query<PublicUser>(insertQuery, [cleanName, cleanEmail, passwordHash]);
        const newUser = result.rows[0];

        if (!newUser) {
            res.status(500).json({ erro: 'Erro interno ao criar conta.' });
            return;
        }

        const publicUser: PublicUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        };

        // Gera o token JWT para já autenticar o usuário após o cadastro
        const token = jwt.sign(
            { id: newUser.id, name: newUser.name, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            mensagem: 'Conta criada com sucesso!',
            token,
            user: publicUser
        });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ erro: 'Erro interno ao criar conta.' });
    }
});

app.post('/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        res.status(400).json({ erro: 'Informe e-mail e senha.' });
        return;
    }

    try {
        const cleanEmail = email.trim().toLowerCase();

        const result = await pool.query<User>(
            'SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
            [cleanEmail]
        );

        const user = result.rows[0];

        if (!user || !user.password_hash) {
            res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            mensagem: 'Login realizado com sucesso!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        res.status(500).json({ erro: 'Erro interno ao realizar login.' });
    }
});

/* ==========================================================================
   3. Transações
   ========================================================================== */

app.get('/transactions', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ erro: 'Usuário não autenticado.' });
        return;
    }

    try {
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

app.post('/transactions', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ erro: 'Usuário não autenticado.' });
        return;
    }

    const { description, value, type, category, date } = req.body;

    if (!validateTransactionPayload(req.body)) {
        res.status(400).json({ erro: 'Dados da transação inválidos ou incompletos.' });
        return;
    }

    try {
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

app.put('/transactions/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ erro: 'Usuário não autenticado.' });
        return;
    }

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

app.delete('/transactions/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ erro: 'Usuário não autenticado.' });
        return;
    }

    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
        res.status(400).json({ erro: 'ID da transação inválido.' });
        return;
    }

    try {
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

/* ==========================================================================
   4. Categorias
   ========================================================================== */

app.get('/categories', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ erro: 'Usuário não autenticado.' });
        return;
    }

    try {
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

app.post('/categories', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ erro: 'Usuário não autenticado.' });
        return;
    }

    const { name, type, icon, color } = req.body;

    if (!validateCategoryPayload(req.body)) {
        res.status(400).json({ erro: 'Nome ou tipo da categoria inválidos.' });
        return;
    }

    try {
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

app.put('/categories/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ erro: 'Usuário não autenticado.' });
        return;
    }

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

app.delete('/categories/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ erro: 'Usuário não autenticado.' });
        return;
    }

    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
        res.status(400).json({ erro: 'ID da categoria inválido.' });
        return;
    }

    try {
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

/* ==========================================================================
   5. Validações e Middlewares
   ========================================================================== */

function validateRegisterPayload(payload: Record<string, unknown>): boolean {
    const { name, email, password } = payload;

    const isValidName = typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 80;
    const isValidEmail = typeof email === 'string' && email.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const isValidPassword = typeof password === 'string' && password.length >= 6 && password.length <= 128;

    return isValidName && isValidEmail && isValidPassword;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (
            typeof decoded !== 'object' ||
            decoded === null ||
            !('id' in decoded) ||
            typeof decoded.id !== 'number' ||
            !Number.isInteger(decoded.id) ||
            decoded.id <= 0
        ) {
            res.status(401).json({ erro: 'Token inválido ou expirado.' });
            return;
        }

        const payload: TokenPayload = {
            id: decoded.id,
            name: typeof decoded.name === 'string' ? decoded.name : '',
            email: typeof decoded.email === 'string' ? decoded.email : ''
        };

        req.userId = payload.id;
        next();
    } catch {
        res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
}

function validateTransactionPayload(payload: Record<string, unknown>): boolean {
    const { description, value, type, category, date } = payload;

    const isValidDescription = typeof description === 'string' && description.trim().length > 0 && description.trim().length <= 200;
    const isValidValue = typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 999999999;
    const isValidType = type === 'income' || type === 'expense';
    const isValidCategory = typeof category === 'string' && category.trim().length > 0 && category.trim().length <= 80;
    const isValidDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);

    return isValidDescription && isValidValue && isValidType && isValidCategory && isValidDate;
}

function validateCategoryPayload(payload: Record<string, unknown>): boolean {
    const { name, type, icon, color } = payload;

    const isValidName = typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 80;
    const isValidType = type === 'income' || type === 'expense';
    const isValidIcon = icon === undefined || (typeof icon === 'string' && /^fa-[a-z0-9-]+$/.test(icon));
    const isValidColor = color === undefined || (typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color));

    return isValidName && isValidType && isValidIcon && isValidColor;
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