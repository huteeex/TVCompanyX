import { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:0112@localhost:5432/TVShow',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Authenticate
    const authHeader = req.headers.authorization || ''
    let token = ''
    if (authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1]
    else if (req.cookies && req.cookies.token) token = req.cookies.token
    
    if (!token) return res.status(401).json({ error: 'Not authenticated' })
    
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    let decoded: any
    try { 
      decoded = jwt.verify(token, secret) 
    } catch (e) { 
      return res.status(401).json({ error: 'Invalid token' }) 
    }
    
    const userId = decoded?.userId
    
    // Get user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    const user = userResult.rows[0]
    
    // Check if user is IT admin
    if (user.role !== 'it_admin') {
      return res.status(403).json({ error: 'Access denied. IT admin only.' })
    }

    if (req.method === 'GET') {
      // Clean up expired sessions first
      await pool.query('SELECT cleanup_expired_sessions()')
      
      // Get active sessions with user info
      const { role } = req.query
      
      let query = `
        SELECT 
          s.*,
          u.name as user_name,
          u.first_name,
          u.last_name,
          u.email,
          u.role as user_role,
          EXTRACT(EPOCH FROM (NOW() - s.last_activity)) as idle_seconds
        FROM active_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.expires_at > NOW()
      `
      
      const params: any[] = []
      let paramIndex = 1
      
      if (role) {
        query += ` AND u.role = $${paramIndex++}`
        params.push(role)
      }
      
      query += ` ORDER BY s.last_activity DESC`
      
      const result = await pool.query(query, params)
      
      // Get statistics
      const statsQuery = `
        SELECT 
          u.role,
          COUNT(*) as count
        FROM active_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.expires_at > NOW()
        GROUP BY u.role
      `
      
      const statsResult = await pool.query(statsQuery)
      
      // Get total active users
      const totalQuery = `
        SELECT COUNT(DISTINCT user_id) as total
        FROM active_sessions
        WHERE expires_at > NOW()
      `
      
      const totalResult = await pool.query(totalQuery)
      
      return res.status(200).json({
        sessions: result.rows,
        statistics: {
          by_role: statsResult.rows,
          total_active: parseInt(totalResult.rows[0].total)
        }
      })
    }

    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })

  } catch (error: any) {
    console.error('Active sessions API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
