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

    // Get query parameters
    const {
      action_type,
      admin_id,
      limit = '50',
      offset = '0'
    } = req.query

    // Build query
    let query = `
      SELECT 
        aal.id,
        aal.admin_id,
        admin.email as admin_email,
        COALESCE(admin.first_name || ' ' || admin.middle_name || ' ' || admin.last_name, admin.name) as admin_name,
        aal.action_type,
        aal.target_user_id,
        target.email as target_user_email,
        COALESCE(target.first_name || ' ' || target.middle_name || ' ' || target.last_name, target.name) as target_user_name,
        aal.action_details,
        aal.created_at
      FROM admin_activity_log aal
      LEFT JOIN users admin ON aal.admin_id = admin.id
      LEFT JOIN users target ON aal.target_user_id = target.id
      WHERE 1=1
    `
    const queryParams: any[] = []
    let paramIndex = 1

    if (action_type) {
      query += ` AND aal.action_type = $${paramIndex}`
      queryParams.push(action_type)
      paramIndex++
    }

    if (admin_id) {
      query += ` AND aal.admin_id = $${paramIndex}`
      queryParams.push(admin_id)
      paramIndex++
    }

    query += ` ORDER BY aal.created_at DESC`
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    queryParams.push(parseInt(limit as string))
    queryParams.push(parseInt(offset as string))

    const result = await pool.query(query, queryParams)

    return res.status(200).json(result.rows)
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
