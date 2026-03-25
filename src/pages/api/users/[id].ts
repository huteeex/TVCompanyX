import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import pool from '../../../lib/database'

function getAuthUser(req: NextApiRequest): any | null {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.cookies?.token
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUser = getAuthUser(req)
  if (!authUser) return res.status(401).json({ error: 'Не авторизован' })
  if (!['admin', 'it_admin'].includes(authUser.role))
    return res.status(403).json({ error: 'Доступ запрещён' })

  const { id } = req.query as { id: string }

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT id, name, first_name, middle_name, last_name, email, role, is_active, phone, created_at, updated_at FROM users WHERE id = $1',
        [id]
      )
      if (result.rowCount === 0) return res.status(404).json({ error: 'Пользователь не найден' })
      return res.status(200).json(result.rows[0])
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, first_name, middle_name, last_name, email, role, is_active, phone } = req.body
      const fields: string[] = []
      const values: any[] = []
      let n = 1

      if (name !== undefined) { fields.push(`name = $${n++}`); values.push(name) }
      if (first_name !== undefined) { fields.push(`first_name = $${n++}`); values.push(first_name) }
      if (middle_name !== undefined) { fields.push(`middle_name = $${n++}`); values.push(middle_name) }
      if (last_name !== undefined) { fields.push(`last_name = $${n++}`); values.push(last_name) }
      if (email !== undefined) { fields.push(`email = $${n++}`); values.push(email) }
      if (role !== undefined) { fields.push(`role = $${n++}`); values.push(role) }
      if (is_active !== undefined) { fields.push(`is_active = $${n++}`); values.push(is_active) }
      if (phone !== undefined) { fields.push(`phone = $${n++}`); values.push(phone) }

      if (fields.length === 0)
        return res.status(400).json({ error: 'Нет полей для обновления' })

      fields.push(`updated_at = now()`)
      values.push(id)

      const result = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${n} RETURNING id, name, first_name, middle_name, last_name, email, role, is_active, phone, created_at, updated_at`,
        values
      )
      if (result.rowCount === 0) return res.status(404).json({ error: 'Пользователь не найден' })
      return res.status(200).json(result.rows[0])
    } catch (error: any) {
      console.error('PUT /api/users/[id] error:', error)
      return res.status(500).json({ error: error.message || 'Ошибка обновления пользователя' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Try hard delete; if FK constraint, deactivate instead
      try {
        await pool.query('DELETE FROM users WHERE id = $1', [id])
      } catch (fkErr: any) {
        if (fkErr.code === '23503') {
          // Foreign key violation — deactivate instead
          await pool.query('UPDATE users SET is_active = false, updated_at = now() WHERE id = $1', [id])
          return res.status(200).json({ success: true, deactivated: true })
        }
        throw fkErr
      }
      return res.status(200).json({ success: true, deleted: true })
    } catch (error: any) {
      console.error('DELETE /api/users/[id] error:', error)
      return res.status(500).json({ error: error.message || 'Ошибка удаления пользователя' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: 'Метод не разрешён' })
}
