import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { db } from '../../../lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current token from cookie
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'No token found' });
    }

    // Verify and decode current token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get fresh user data from database
    const user = await db.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account deactivated' });
    }

    // Generate new JWT token with updated role from database
    const newToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set new HttpOnly cookie
    const maxAge = 7 * 24 * 60 * 60; // 7 days
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = `HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${isProd ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', `token=${newToken}; ${cookieOptions}`);

    // Return updated user data
    const { password_hash, ...userWithoutPassword } = user;

    return res.status(200).json({ 
      success: true,
      user: userWithoutPassword,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
