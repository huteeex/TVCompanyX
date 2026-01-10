import type { NextApiRequest, NextApiResponse } from 'next'
import { verify } from 'jsonwebtoken'
import pool from '../../../lib/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface JWTPayload {
  userId: string
  email: string
  role: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify JWT and check IT admin role
    const token = req.cookies.token
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    let decoded: JWTPayload
    try {
      decoded = verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    if (decoded.role !== 'it_admin') {
      return res.status(403).json({ error: 'Access denied. IT admin role required.' })
    }

    // Get total users
    const totalQuery = 'SELECT COUNT(*) as total FROM users'
    const totalResult = await pool.query(totalQuery)
    const total_users = parseInt(totalResult.rows[0].total)

    // Get active/inactive counts
    const activeQuery = `
      SELECT 
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive
      FROM users
    `
    const activeResult = await pool.query(activeQuery)
    const active_users = parseInt(activeResult.rows[0].active)
    const inactive_users = parseInt(activeResult.rows[0].inactive)

    // Get by role
    const roleQuery = `
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `
    const roleResult = await pool.query(roleQuery)
    const by_role = roleResult.rows.map(row => ({
      role: row.role,
      count: parseInt(row.count)
    }))

    return res.status(200).json({
      total_users,
      active_users,
      inactive_users,
      by_role
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
