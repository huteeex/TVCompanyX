import { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:0112@localhost:5432/TVShow',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid error log ID' })
  }

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

    if (req.method === 'PATCH') {
      // Resolve error
      const { resolution_notes } = req.body
      
      const query = `
        UPDATE error_logs
        SET resolved = true,
            resolved_by = $1,
            resolved_at = NOW(),
            resolution_notes = $2
        WHERE id = $3
        RETURNING *
      `
      
      const result = await pool.query(query, [userId, resolution_notes || null, id])
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Error log not found' })
      }
      
      return res.status(200).json(result.rows[0])
    }

    res.setHeader('Allow', ['PATCH'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })

  } catch (error: any) {
    console.error('Error log resolve error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
