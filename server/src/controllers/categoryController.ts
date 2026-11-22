import { type Response } from 'express';
import { type AuthRequest } from '../middlewares/authMiddleware.js';
import { validateCategoryPayload } from '../utils/validators.js';
import * as categoryRepository from '../repositories/categoryRepository.js';

export async function getCategories(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ erro: 'Usuário não autenticado.' });
        return;
    }

    try {
        const categories = await categoryRepository.findAllCategoriesByUser(userId);
        res.json(categories);
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({ erro: 'Erro interno ao buscar categorias.' });
    }
}

export async function createCategory(req: AuthRequest, res: Response): Promise<void> {
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

        const isDuplicate = await categoryRepository.hasDuplicateCategory(cleanName, type, userId);

        if (isDuplicate) {
            res.status(409).json({ erro: 'Já existe uma categoria com este nome para este tipo.' });
            return;
        }

        const created = await categoryRepository.createCategory(
            cleanName,
            type,
            userId,
            categoryIcon,
            categoryColor
        );

        res.status(201).json(created);
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ erro: 'Erro interno ao salvar categoria.' });
    }
}

export async function updateCategory(req: AuthRequest, res: Response): Promise<void> {
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
        const isDuplicate = await categoryRepository.hasDuplicateCategory(cleanName, type, userId, id);

        if (isDuplicate) {
            res.status(409).json({ erro: 'Já existe uma categoria com este nome para este tipo.' });
            return;
        }

        const updated = await categoryRepository.updateCategory(
            id,
            userId,
            cleanName,
            type,
            icon ?? null,
            color ?? null
        );

        if (!updated) {
            res.status(404).json({ erro: 'Categoria não encontrada ou não pode ser editada.' });
            return;
        }

        res.status(200).json(updated);
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ erro: 'Erro interno ao atualizar categoria.' });
    }
}

export async function deleteCategory(req: AuthRequest, res: Response): Promise<void> {
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
        const deleted = await categoryRepository.deleteCategory(id, userId);

        if (!deleted) {
            res.status(404).json({ erro: 'Categoria não encontrada ou não pode ser removida.' });
            return;
        }

        res.status(200).json({
            mensagem: 'Categoria removida com sucesso.',
            category: deleted
        });
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23503') {
            res.status(409).json({ erro: 'Não é possível excluir uma categoria que possui transações vinculadas.' });
            return;
        }

        console.error('Erro ao excluir categoria:', error);
        res.status(500).json({ erro: 'Erro interno ao excluir categoria.' });
    }
}