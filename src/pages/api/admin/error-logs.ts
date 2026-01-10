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

    switch (req.method) {
      case 'GET': {
        // Get error logs
        const { resolved, errorType, limit = '50', offset = '0' } = req.query
        
        let query = `
          SELECT 
            e.*,
            u.name as user_name,
            u.email as user_email,
            r.name as resolved_by_name
          FROM error_logs e
          LEFT JOIN users u ON e.user_id = u.id
          LEFT JOIN users r ON e.resolved_by = r.id
          WHERE 1=1
        `
        
        const params: any[] = []
        let paramIndex = 1
        
        if (resolved !== undefined) {
          query += ` AND e.resolved = $${paramIndex++}`
          params.push(resolved === 'true')
        }
        
        if (errorType) {
          query += ` AND e.error_type = $${paramIndex++}`
          params.push(errorType)
        }
        
        query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
        params.push(parseInt(limit as string), parseInt(offset as string))
        
        const result = await pool.query(query, params)
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM error_logs WHERE 1=1'
        const countParams: any[] = []
        let countParamIndex = 1
        
        if (resolved !== undefined) {
          countQuery += ` AND resolved = $${countParamIndex++}`
          countParams.push(resolved === 'true')
        }
        
        if (errorType) {
          countQuery += ` AND error_type = $${countParamIndex++}`
          countParams.push(errorType)
        }
        
        const countResult = await pool.query(countQuery, countParams)
        
        return res.status(200).json({
          errors: result.rows,
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        })
      }

      case 'POST': {
        // Log new error
        const {
          user_id,
          error_type,
          error_message,
          error_stack,
          url,
          method,
          status_code,
          user_agent,
          ip_address
        } = req.body
        
        if (!error_type || !error_message) {
          return res.status(400).json({ error: 'Missing required fields' })
        }
        
        const query = `
          INSERT INTO error_logs (
            user_id, error_type, error_message, error_stack,
            url, method, status_code, user_agent, ip_address
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `
        
        const values = [
          user_id || null,
          error_type,
          error_message,
          error_stack || null,
          url || null,
          method || null,
          status_code || null,
          user_agent || null,
          ip_address || null
        ]
        
        const result = await pool.query(query, values)
        return res.status(201).json(result.rows[0])
      }

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error: any) {
    console.error('Error logs API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
