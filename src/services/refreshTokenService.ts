import { User } from '../models/index.js';
import { generateRefreshToken, getRefreshTokenExpiry } from '../utils/jwt.js';

class RefreshTokenService {
  /**
   * Generate a new refresh token for a user and store it in the database.
   * @param userId - ID of the user
   * @returns The newly generated refresh token
   */
  async createRefreshToken(userId: number): Promise<string> {
    const token = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    await User.update(
      {
        refreshToken: token,
        refreshTokenExpiresAt: expiresAt,
      },
      { where: { id: userId } }
    );

    return token;
  }

  /**
   * Verify if a refresh token is valid and not expired.
   * @param token - Refresh token string
   * @returns User instance if valid, otherwise null
   */
  async verifyRefreshToken(token: string): Promise<User | null> {
    const user = await User.findOne({ where: { refreshToken: token } });

    if (!user) {
      console.warn(`[RefreshTokenService] No user found for token: ${token}`);
      return null;
    }

    // Check expiration
    if (user.isRefreshTokenExpired()) {
      console.info(`[RefreshTokenService] Refresh token expired for user ID: ${user.id}`);
      await this.clearRefreshToken(user.id);
      return null;
    }

    return user;
  }

  /**
   * Clear a user's refresh token (used for logout or token invalidation)
   * @param userId - ID of the user
   * @returns True if a record was updated, false otherwise
   */
  async clearRefreshToken(userId: number): Promise<boolean> {
    const [updatedRows] = await User.update(
      {
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
      { where: { id: userId } }
    );

    return updatedRows > 0;
  }
}

export default new RefreshTokenService();