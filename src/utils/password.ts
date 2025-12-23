import bcrypt from 'bcryptjs';

// Simple password utilities
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

export const comparePassword = async (
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

// Basic password validation
export const validatePassword = (password: string): string | null => {
    if (!password) {
        return 'Password is required';
    }

    if (password.length < 8) {
        return 'Password must be at least 6 characters';
    }

    if (password.length > 100) {
        return 'Password is too long';
    }

    // Password must contain:
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one number
    // - At least one special character (e.g., !@#$%^&*)
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).+$/;

    if (!passwordPattern.test(password)) {
        return 'Password must contain uppercase, lowercase, number, and special character';
    }

    return null; // No error
};