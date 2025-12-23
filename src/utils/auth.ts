import type { User } from "../models/index.js";
import refreshTokenService from "../services/refreshTokenService.js";
import { generateAccessToken } from "./jwt.js";

export const createTokensForUser = async (user: User) => {
    const payload = { id: user.id, email: user.email, username: user.username };
    const accessToken = generateAccessToken(payload);
    const refreshToken = await refreshTokenService.createRefreshToken(user.id);
    return { accessToken, refreshToken };
};