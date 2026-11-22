import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthRequest extends Request {
    userId?: number;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, env.jwtSecret);

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

        req.userId = decoded.id;
        next();
    } catch {
        res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
}