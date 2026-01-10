import { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

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
        // Get all staff members (not customers)
        const { role, isActive } = req.query
        
        let query = `
          SELECT 
            id, name, first_name, middle_name, last_name, 
            email, role, is_active, phone, bank_details, created_at
          FROM users
          WHERE role != 'customer'
        `
        
        const params: any[] = []
        let paramIndex = 1
        
        if (role) {
          query += ` AND role = $${paramIndex++}`
          params.push(role)
        }
        
        if (isActive !== undefined) {
          query += ` AND is_active = $${paramIndex++}`
          params.push(isActive === 'true')
        }
        
        query += ` ORDER BY created_at DESC`
        
        const result = await pool.query(query, params)
        return res.status(200).json(result.rows)
      }

      case 'POST': {
        // Create new staff member
        const {
          email,
          password,
          first_name,
          middle_name,
          last_name,
          name,
          role,
          phone,
          bank_details
        } = req.body
        
        if (!email || !password || !role) {
          return res.status(400).json({ error: 'Missing required fields: email, password, role' })
        }
        
        // Check if role is valid staff role
        const validRoles = ['agent', 'commercial', 'director', 'accountant', 'company', 'it_admin']
        if (!validRoles.includes(role)) {
          return res.status(400).json({ error: 'Invalid role for staff member' })
        }
        
        // Check if email already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email])
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ error: 'Email already exists' })
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)
        
        // Create user
        const query = `
          INSERT INTO users (
            email, password_hash, first_name, middle_name, last_name,
            name, role, phone, bank_details, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
          RETURNING id, name, first_name, middle_name, last_name, email, role, is_active, phone, bank_details, created_at
        `
        
        const values = [
          email,
          passwordHash,
          first_name || null,
          middle_name || null,
          last_name || null,
          name || `${first_name || ''} ${last_name || ''}`.trim() || email,
          role,
          phone || null,
          bank_details || null
        ]
        
        const result = await pool.query(query, values)
        const newUser = result.rows[0]
        
        // Log admin activity
        await pool.query(
          `INSERT INTO admin_activity_log (admin_id, action_type, target_user_id, action_details)
           VALUES ($1, 'user_created', $2, $3)`,
          [userId, newUser.id, JSON.stringify({ role, email, name: newUser.name })]
        )
        
        return res.status(201).json(newUser)
      }

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error: any) {
    console.error('Staff management API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
