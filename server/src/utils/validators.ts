export function validateRegisterPayload(payload: Record<string, unknown>): boolean {
    const { name, email, password } = payload;

    const isValidName = typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 80;
    const isValidEmail = typeof email === 'string' && email.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const isValidPassword = typeof password === 'string' && password.length >= 6 && password.length <= 128;

    return isValidName && isValidEmail && isValidPassword;
}

export function validateTransactionPayload(payload: Record<string, unknown>): boolean {
    const { description, value, type, category, date } = payload;

    const isValidDescription = typeof description === 'string' && description.trim().length > 0 && description.trim().length <= 200;
    const isValidValue = typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 999999999;
    const isValidType = type === 'income' || type === 'expense';
    const isValidCategory = typeof category === 'string' && category.trim().length > 0 && category.trim().length <= 80;
    const isValidDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);

    return isValidDescription && isValidValue && isValidType && isValidCategory && isValidDate;
}

export function validateCategoryPayload(payload: Record<string, unknown>): boolean {
    const { name, type, icon, color } = payload;

    const isValidName = typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 80;
    const isValidType = type === 'income' || type === 'expense';
    const isValidIcon = icon === undefined || (typeof icon === 'string' && /^fa-[a-z0-9-]+$/.test(icon));
    const isValidColor = color === undefined || (typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color));

    return isValidName && isValidType && isValidIcon && isValidColor;
}