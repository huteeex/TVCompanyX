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
    // Users by role
    const usersByRoleResult = await pool.query(
      `SELECT role, COUNT(*)::int as count FROM users GROUP BY role ORDER BY count DESC`
    )

    // Total and active users
    const userTotalsResult = await pool.query(
      `SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE is_active = true)::int as active FROM users`
    )

    // Applications by status (across all workflow tables)
    const appsByStatusResult = await pool.query(`
      SELECT status, COUNT(*)::int as count FROM (
        SELECT status FROM applications
        UNION ALL SELECT status FROM pending_applications
        UNION ALL SELECT status FROM approved_applications
        UNION ALL SELECT status FROM rejected_applications
      ) t GROUP BY status ORDER BY count DESC
    `)

    // Revenue by month (last 6 months from approved/paid applications)
    const revenueByMonthResult = await pool.query(`
      SELECT
        to_char(date_trunc('month', created_at), 'Mon YYYY') as month,
        date_trunc('month', created_at) as month_date,
        SUM(cost)::numeric as revenue,
        COUNT(*)::int as count
      FROM (
        SELECT cost, created_at FROM approved_applications
        UNION ALL
        SELECT cost, created_at FROM rejected_applications WHERE status = 'paid'
      ) t
      WHERE created_at >= now() - interval '6 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY month_date ASC
    `)

    // Total revenue
    const totalRevenueResult = await pool.query(`
      SELECT COALESCE(SUM(cost), 0)::numeric as total FROM approved_applications WHERE status = 'paid'
    `)

    // Shows count
    const showsResult = await pool.query(`SELECT COUNT(*)::int as total FROM shows`)

    // New users last 30 days
    const newUsersResult = await pool.query(`
      SELECT COUNT(*)::int as count FROM users WHERE created_at >= now() - interval '30 days'
    `)

    // Applications by month (last 6 months)
    const appsByMonthResult = await pool.query(`
      SELECT
        to_char(date_trunc('month', created_at), 'Mon YYYY') as month,
        date_trunc('month', created_at) as month_date,
        COUNT(*)::int as count
      FROM (
        SELECT created_at FROM applications
        UNION ALL SELECT created_at FROM pending_applications
        UNION ALL SELECT created_at FROM approved_applications
        UNION ALL SELECT created_at FROM rejected_applications
      ) t
      WHERE created_at >= now() - interval '6 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY month_date ASC
    `)

    return res.status(200).json({
      users: {
        total: userTotalsResult.rows[0]?.total ?? 0,
        active: userTotalsResult.rows[0]?.active ?? 0,
        newLast30Days: newUsersResult.rows[0]?.count ?? 0,
        byRole: usersByRoleResult.rows,
      },
      applications: {
        byStatus: appsByStatusResult.rows,
        byMonth: appsByMonthResult.rows,
      },
      revenue: {
        total: totalRevenueResult.rows[0]?.total ?? 0,
        byMonth: revenueByMonthResult.rows,
      },
      shows: {
        total: showsResult.rows[0]?.total ?? 0,
      },
    })
  } catch (error: any) {
    console.error('GET /api/admin/stats error:', error)
    return res.status(500).json({ error: error.message || 'Ошибка получения статистики' })
  }
}
