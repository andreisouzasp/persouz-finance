import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { pool } from './database/db.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.json({ mensagem: 'API do Persouz Finance operante!' });
});

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/transactions', transactionRoutes);

app.listen(env.port, async () => {
    console.log(`Servidor do Persouz Finance rodando na porta ${env.port}!`);

    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Conectado ao PostgreSQL com sucesso! Hora do banco:', res.rows[0].now);
    } catch (error) {
        console.error('Erro ao conectar no PostgreSQL:', error);
    }
});