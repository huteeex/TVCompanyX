import { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:0112@localhost:5432/TVShow',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid staff ID' })
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

    switch (req.method) {
      case 'GET': {
        // Get single staff member
        const result = await pool.query(
          `SELECT id, name, first_name, middle_name, last_name, email, role, is_active, phone, bank_details, created_at
           FROM users WHERE id = $1 AND role != 'customer'`,
          [id]
        )
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Staff member not found' })
        }
        
        return res.status(200).json(result.rows[0])
      }

      case 'PUT': {
        // Update staff member
        const {
          email,
          password,
          first_name,
          middle_name,
          last_name,
          name,
          role,
          phone,
          bank_details,
          is_active
        } = req.body
        
        // Build update query dynamically
        const updates: string[] = []
        const values: any[] = []
        let paramIndex = 1
        
        if (email !== undefined) {
          // Check if email is already taken by another user
          const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND id != $2',
            [email, id]
          )
          if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' })
          }
          updates.push(`email = $${paramIndex++}`)
          values.push(email)
        }
        
        if (password) {
          const passwordHash = await bcrypt.hash(password, 10)
          updates.push(`password_hash = $${paramIndex++}`)
          values.push(passwordHash)
        }
        
        if (first_name !== undefined) {
          updates.push(`first_name = $${paramIndex++}`)
          values.push(first_name)
        }
        
        if (middle_name !== undefined) {
          updates.push(`middle_name = $${paramIndex++}`)
          values.push(middle_name)
        }
        
        if (last_name !== undefined) {
          updates.push(`last_name = $${paramIndex++}`)
          values.push(last_name)
        }
        
        if (name !== undefined) {
          updates.push(`name = $${paramIndex++}`)
          values.push(name)
        }
        
        if (role !== undefined) {
          const validRoles = ['agent', 'commercial', 'director', 'accountant', 'company', 'it_admin']
          if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role for staff member' })
          }
          updates.push(`role = $${paramIndex++}`)
          values.push(role)
        }
        
        if (phone !== undefined) {
          updates.push(`phone = $${paramIndex++}`)
          values.push(phone)
        }
        
        if (bank_details !== undefined) {
          updates.push(`bank_details = $${paramIndex++}`)
          values.push(bank_details)
        }
        
        if (is_active !== undefined) {
          updates.push(`is_active = $${paramIndex++}`)
          values.push(is_active)
        }
        
        if (updates.length === 0) {
          return res.status(400).json({ error: 'No fields to update' })
        }
        
        values.push(id)
        const query = `
          UPDATE users 
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex} AND role != 'customer'
          RETURNING id, name, first_name, middle_name, last_name, email, role, is_active, phone, bank_details, created_at
        `
        
        const result = await pool.query(query, values)
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Staff member not found' })
        }
        
        // Log admin activity
        await pool.query(
          `INSERT INTO admin_activity_log (admin_id, action_type, target_user_id, action_details)
           VALUES ($1, 'user_updated', $2, $3)`,
          [userId, id, JSON.stringify(req.body)]
        )
        
        return res.status(200).json(result.rows[0])
      }

      case 'DELETE': {
        // Deactivate staff member (soft delete)
        const result = await pool.query(
          `UPDATE users 
           SET is_active = false
           WHERE id = $1 AND role != 'customer'
           RETURNING id, name, email`,
          [id]
        )
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Staff member not found' })
        }
        
        // Log admin activity
        await pool.query(
          `INSERT INTO admin_activity_log (admin_id, action_type, target_user_id, action_details)
           VALUES ($1, 'user_deleted', $2, $3)`,
          [userId, id, JSON.stringify({ deactivated: true })]
        )
        
        return res.status(200).json({ message: 'Staff member deactivated successfully' })
      }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error: any) {
    console.error('Staff update API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
