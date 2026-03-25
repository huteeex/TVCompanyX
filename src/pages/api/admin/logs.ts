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
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authUser = getAuthUser(req)
  if (!authUser) return res.status(401).json({ error: 'Не авторизован' })
  if (!['admin', 'it_admin'].includes(authUser.role))
    return res.status(403).json({ error: 'Доступ запрещён' })

  try {
    const { entity, action, limit = '100', offset = '0', dateFrom, dateTo } = req.query

    const conditions: string[] = []
    const values: any[] = []
    let n = 1

    if (entity) { conditions.push(`al.entity = $${n++}`); values.push(entity) }
    if (action) { conditions.push(`al.action = $${n++}`); values.push(action) }
    if (dateFrom) { conditions.push(`al.changed_at >= $${n++}`); values.push(dateFrom) }
    if (dateTo) { conditions.push(`al.changed_at <= $${n++}`); values.push(dateTo) }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const logsResult = await pool.query(
      `SELECT al.id, al.entity, al.entity_id, al.action, al.changed_at, al.payload,
              u.name as changed_by_name, u.email as changed_by_email
       FROM audit_log al
       LEFT JOIN users u ON al.changed_by = u.id
       ${where}
       ORDER BY al.changed_at DESC
       LIMIT $${n++} OFFSET $${n++}`,
      [...values, parseInt(limit as string, 10), parseInt(offset as string, 10)]
    )

    const countResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM audit_log al ${where}`,
      values
    )

    // Also get distinct entity types and actions for filter options
    const metaResult = await pool.query(
      `SELECT DISTINCT entity FROM audit_log ORDER BY entity`
    )
    const actionsResult = await pool.query(
      `SELECT DISTINCT action FROM audit_log ORDER BY action`
    )

    return res.status(200).json({
      logs: logsResult.rows,
      total: countResult.rows[0]?.total ?? 0,
      entityTypes: metaResult.rows.map((r: any) => r.entity),
      actionTypes: actionsResult.rows.map((r: any) => r.action),
    })
  } catch (error: any) {
    console.error('GET /api/admin/logs error:', error)
    return res.status(500).json({ error: error.message || 'Ошибка получения логов' })
  }
}
