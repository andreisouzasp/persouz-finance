export const env = {
    port: Number(process.env.PORT) || 3000,
    jwtSecret: process.env.JWT_SECRET || 'chave_fallback_desenvolvimento'
};