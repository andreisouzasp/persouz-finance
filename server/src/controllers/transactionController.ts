import { type Response } from 'express';
import { type AuthRequest } from '../middlewares/authMiddleware.js';
import { validateTransactionPayload } from '../utils/validators.js';
import { findCategoryId } from '../repositories/categoryRepository.js';
import * as transactionRepository from '../repositories/transactionRepository.js';

export async function getTransactions(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ erro: 'Usuário não autenticado.' });
        return;
    }

    try {
        const transactions = await transactionRepository.findAllTransactionsByUser(userId);
        res.json(transactions);
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        res.status(500).json({ erro: 'Erro interno ao buscar transações.' });
    }
}

export async function createTransaction(req: AuthRequest, res: Response): Promise<void> {
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

        const created = await transactionRepository.createTransaction(
            userId,
            categoryId,
            description.trim(),
            value,
            type,
            date
        );

        res.status(201).json({ ...created, category });
    } catch (error) {
        console.error('Erro ao criar transação:', error);
        res.status(500).json({ erro: 'Erro interno ao salvar transação.' });
    }
}

export async function updateTransaction(req: AuthRequest, res: Response): Promise<void> {
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

        const updated = await transactionRepository.updateTransaction(
            id,
            userId,
            description.trim(),
            value,
            type,
            categoryId,
            date
        );

        if (!updated) {
            res.status(404).json({ erro: 'Transação não encontrada.' });
            return;
        }

        res.status(200).json({ ...updated, category });
    } catch (error) {
        console.error('Erro ao atualizar transação:', error);
        res.status(500).json({ erro: 'Erro interno ao atualizar transação.' });
    }
}

export async function deleteTransaction(req: AuthRequest, res: Response): Promise<void> {
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
        const deleted = await transactionRepository.deleteTransaction(id, userId);

        if (!deleted) {
            res.status(404).json({ erro: 'Transação não encontrada.' });
            return;
        }

        res.status(200).json({
            mensagem: 'Transação removida com sucesso.',
            transaction: deleted
        });
    } catch (error) {
        console.error('Erro ao excluir transação:', error);
        res.status(500).json({ erro: 'Erro interno ao excluir transação.' });
    }
}