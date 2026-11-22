import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { type PublicUser } from '../interfaces/User.js';
import { validateRegisterPayload } from '../utils/validators.js';
import * as userRepository from '../repositories/userRepository.js';

export async function register(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body;

    if (!validateRegisterPayload(req.body)) {
        res.status(400).json({ erro: 'Preencha nome, e-mail válido e senha com pelo menos 6 caracteres.' });
        return;
    }

    try {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        const existingUserId = await userRepository.findUserIdByEmail(cleanEmail);

        if (existingUserId !== null) {
            res.status(409).json({ erro: 'Este e-mail já está em uso.' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await userRepository.createUser(cleanName, cleanEmail, passwordHash);

        if (!newUser) {
            res.status(500).json({ erro: 'Erro interno ao criar conta.' });
            return;
        }

        const publicUser: PublicUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        };

        const token = jwt.sign(
            { id: publicUser.id, name: publicUser.name, email: publicUser.email },
            env.jwtSecret,
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
}

export async function login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        res.status(400).json({ erro: 'Informe e-mail e senha.' });
        return;
    }

    try {
        const cleanEmail = email.trim().toLowerCase();
        const user = await userRepository.findUserByEmail(cleanEmail);

        if (!user || !user.password_hash) {
            res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
            return;
        }

        const publicUser: PublicUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        const token = jwt.sign(
            { id: publicUser.id, name: publicUser.name, email: publicUser.email },
            env.jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            mensagem: 'Login realizado com sucesso!',
            token,
            user: publicUser
        });
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        res.status(500).json({ erro: 'Erro interno ao realizar login.' });
    }
}