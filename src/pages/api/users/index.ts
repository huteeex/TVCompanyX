import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from '../../../lib/database'

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

  if (req.method === 'GET') {
    try {
      const users = await db.getUsers()
      return res.status(200).json(users)
    } catch (error: any) {
      console.error('GET /api/users error:', error)
      return res.status(500).json({ error: 'Ошибка получения пользователей' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, first_name, middle_name, last_name, email, password, role, phone } = req.body
      if (!email || !password || !role)
        return res.status(400).json({ error: 'Email, пароль и роль обязательны' })

      const existingUser = await db.getUserByEmail(email)
      if (existingUser) return res.status(409).json({ error: 'Пользователь с таким email уже существует' })

      const password_hash = await bcrypt.hash(password, 12)
      const newUser = await db.createUser({
        name: name || null,
        first_name: first_name || null,
        middle_name: middle_name || null,
        last_name: last_name || null,
        email,
        password_hash,
        role,
        phone: phone || null,
      })
      return res.status(201).json(newUser)
    } catch (error: any) {
      console.error('POST /api/users error:', error)
      return res.status(500).json({ error: error.message || 'Ошибка создания пользователя' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Метод не разрешён' })
}
