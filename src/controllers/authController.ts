import type { Request, Response } from 'express';
import { User } from '../models/index.js';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import { generateAccessToken } from '../utils/jwt.js';
import refreshTokenService from '../services/refreshTokenService.js';
import { sendError } from '../utils/helper.js';
import { createTokensForUser } from '../utils/auth.js';

// ==================== REGISTER ====================
export const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return sendError(res, 400, 'All fields (username, email, password) are required.');
        }

        // Validate password strength
        const passwordIssue = validatePassword(password);
        if (passwordIssue) return sendError(res, 400, passwordIssue);

        // Check if email already exists
        const emailTaken = await User.findOne({ where: { email } });
        if (emailTaken) return sendError(res, 409, 'Email is already in use.');

        // Check if username is taken
        const usernameTaken = await User.findOne({ where: { username } });
        if (usernameTaken) return sendError(res, 409, 'Username is already taken.');

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create the new user
        const newUser = await User.create({ username, email, password: hashedPassword });

        // Generate tokens
        const tokens = await createTokensForUser(newUser);

        return res.status(201).json({
            success: true,
            message: `Welcome aboard, ${newUser.username}! Your account was created successfully.`,
            data: { user: newUser.toJSON(), ...tokens },
        });
    } catch (err: any) {
        console.error('[Auth][Register] Error:', err);
        return sendError(res, 500, 'Something went wrong during registration.');
    }
};

// ==================== LOGIN ====================
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return sendError(res, 400, 'Email and password are required.');

        const foundUser = await User.findOne({ where: { email } });
        if (!foundUser) return sendError(res, 401, 'Invalid email or password.');

        const passwordMatches = await comparePassword(password, foundUser.password);
        if (!passwordMatches) return sendError(res, 401, 'Invalid email or password.');

        // Generate tokens
        const tokens = await createTokensForUser(foundUser);

        return res.status(200).json({
            success: true,
            message: `Welcome back, ${foundUser.username}!`,
            data: { user: foundUser.toJSON(), ...tokens },
        });
    } catch (err: any) {
        console.error('[Auth][Login] Error:', err);
        return sendError(res, 500, 'Error occurred during login.');
    }
};

// ==================== REFRESH ACCESS TOKEN ====================
export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return sendError(res, 400, 'Refresh token is required.');

        const user = await refreshTokenService.verifyRefreshToken(refreshToken);
        if (!user) return sendError(res, 401, 'Invalid or expired refresh token.');

        const newAccessToken = generateAccessToken({
            id: user.id,
            email: user.email,
            username: user.username,
        });

        return res.status(200).json({
            success: true,
            message: 'Access token refreshed successfully.',
            data: {
                accessToken: newAccessToken,
                refreshToken: user.refreshToken,
            },
        });
    } catch (err: any) {
        console.error('[Auth][Refresh] Error:', err);
        return sendError(res, 500, 'Could not refresh access token.');
    }
};