import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { db } from '../../../lib/database'
import pool from '../../../lib/database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization || ''
    let token = ''

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key'
    const decoded: any = jwt.verify(token, secret)

    const userId = decoded?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const user = await db.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account deactivated' })
    }

    // If role in DB differs from role in token, issue a new token
    if (user.role !== decoded.role) {
      const newToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role 
        },
        secret,
        { expiresIn: '7d' }
      )

      // Set new HttpOnly cookie
      const maxAge = 7 * 24 * 60 * 60 // 7 days
      const isProd = process.env.NODE_ENV === 'production'
      const cookieOptions = `HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${isProd ? '; Secure' : ''}`
      res.setHeader('Set-Cookie', `token=${newToken}; ${cookieOptions}`)
    }

    // Update last_activity in active_sessions
    try {
      await pool.query(
        'UPDATE active_sessions SET last_activity = NOW() WHERE session_token = $1',
        [token]
      );
    } catch (sessionError) {
      console.error('Error updating session activity:', sessionError);
      // Don't fail the request if session update fails
    }

  // return public user fields (include phone, bank_details and split name fields)
  return res.status(200).json({
    id: user.id,
    name: user.name,
    first_name: user.first_name,
    middle_name: user.middle_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    bank_details: user.bank_details
  })
  } catch (error: any) {
    console.error('Auth me error:', error)
    return res.status(500).json({ error: error.message || 'Failed to authenticate' })
  }
}
