const db = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
    // Create new user
    static async create(username, email, password, name) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.runAsync(
            "INSERT INTO users (username, email, password, name) VALUES (?, ?, ?, ?)",
            [username, email, hashedPassword, name || username]
        );
        return result.id;
    }

    // Find user by username
    static async findByUsername(username) {
        return await db.getAsync("SELECT * FROM users WHERE username = ?", [username]);
    }

    // Find user by email
    static async findByEmail(email) {
        return await db.getAsync("SELECT * FROM users WHERE email = ?", [email]);
    }

    // Find user by Google ID
    static async findByGoogleId(googleId) {
        return await db.getAsync("SELECT * FROM users WHERE google_id = ?", [googleId]);
    }

    // Find user by LinkedIn ID
    static async findByLinkedinId(linkedinId) {
        return await db.getAsync("SELECT * FROM users WHERE linkedin_id = ?", [linkedinId]);
    }

    // Create user from social login
    static async createFromSocial(username, email, provider, socialId, name) {
        // Generate a random password since social login doesn't use it
        const randomPassword = require('crypto').randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const column = provider === 'google' ? 'google_id' : 'linkedin_id';

        const result = await db.runAsync(
            `INSERT INTO users (username, email, password, ${column}, name) VALUES (?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, socialId, name]
        );
        return result.id;
    }

    // Update social ID for existing user
    static async updateSocialId(userId, provider, socialId) {
        const column = provider === 'google' ? 'google_id' : 'linkedin_id';
        await db.runAsync(
            `UPDATE users SET ${column} = ? WHERE id = ?`,
            [socialId, userId]
        );
    }

    // Find user by ID
    static async findById(id) {
        return await db.getAsync(
            "SELECT id, username, email, name, has_voted, created_at FROM users WHERE id = ?",
            [id]
        );
    }

    // Verify password
    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Update password
    static async updatePassword(userId, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.runAsync(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );
    }

    // Mark user as voted
    static async markAsVoted(userId) {
        await db.runAsync(
            "UPDATE users SET has_voted = 1 WHERE id = ?",
            [userId]
        );
    }

    // Generate JWT token
    static generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                username: user.username,
                hasVoted: user.has_voted
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    // Verify token
    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
}

module.exports = User;