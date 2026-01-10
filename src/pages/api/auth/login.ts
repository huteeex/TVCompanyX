import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { db } from '../../../lib/database';
import pool from '../../../lib/database';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    // Get user by email
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Аккаунт деактивирован' });
    }

    // Verify password (defensive: ensure password_hash exists)
    const storedHash = (user as any).password_hash || (user as any).passwordHash || null
    if (!storedHash) {
      console.error('Login attempted but user has no password_hash set for id', user.id)
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }

    const isPasswordValid = await bcrypt.compare(password, storedHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Create or update active session
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
      
      // Delete old sessions for this user (if any)
      await pool.query('DELETE FROM active_sessions WHERE user_id = $1', [user.id]);
      
      // Create new session
      await pool.query(
        `INSERT INTO active_sessions (user_id, session_token, ip_address, user_agent, expires_at) 
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, token, ipAddress, userAgent, expiresAt]
      );
    } catch (sessionError) {
      console.error('Error creating session:', sessionError);
      // Don't fail login if session creation fails
    }

    // Return user data and token (without password hash)
    const { password_hash, ...userWithoutPassword } = user;

    // Set HttpOnly cookie for the token (server-side managed session)
    const maxAge = 7 * 24 * 60 * 60 // 7 days
    const isProd = process.env.NODE_ENV === 'production'
    const cookieOptions = `HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${isProd ? '; Secure' : ''}`
    res.setHeader('Set-Cookie', `token=${token}; ${cookieOptions}`)

    res.status(200).json({
      message: 'Успешный вход',
      token, // still returning token in body for client use if needed
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login API error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}



