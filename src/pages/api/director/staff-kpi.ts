import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify JWT token
    const token = req.cookies.token
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Check if user is director
    if (decoded.role !== 'director') {
      return res.status(403).json({ error: 'Access denied. Director role required.' })
    }

    const { start_date, end_date, role_filter } = req.query

    // Get all applications
    let applications = await db.getApplications()

    // Filter by date range if specified
    if (start_date && end_date) {
      const start = new Date(String(start_date))
      start.setHours(0, 0, 0, 0)
      
      const end = new Date(String(end_date))
      end.setHours(23, 59, 59, 999)
      
      applications = applications.filter((app: any) => {
        const appDate = new Date(app.created_at)
        return appDate >= start && appDate <= end
      })
    }

    // Filter approved applications for revenue calculation
    const approvedApplications = applications.filter((app: any) => app.status === 'approved')

    // Get all users
    const users = await db.getUsers()

    // Calculate KPI for each staff member
    const staffKPI = users
      .filter((user: any) => ['agent', 'commercial'].includes(user.role))
      .map((user: any) => {
        // Get applications handled by this user
        const userApplications = applications.filter((app: any) => {
          if (user.role === 'agent') {
            return app.agent_id === user.id
          } else if (user.role === 'commercial') {
            return app.commercial_id === user.id
          }
          return false
        })

        const approvedByUser = userApplications.filter((app: any) => app.status === 'approved')
        const rejectedByUser = userApplications.filter((app: any) => app.status === 'rejected')

        // Calculate revenue (sum of approved applications cost)
        const revenue = approvedByUser.reduce((sum: number, app: any) => {
          return sum + (parseFloat(app.cost) || 0)
        }, 0)

        // Calculate KPI (approval rate)
        const totalHandled = approvedByUser.length + rejectedByUser.length
        const kpi = totalHandled > 0 ? Math.round((approvedByUser.length / totalHandled) * 100) : 0

        // Calculate commission (5% for agents, 0 for commercial)
        const commission = user.role === 'agent' ? revenue * 0.05 : 0

        // Get unique shows
        const uniqueShows = Array.from(new Set(approvedByUser.map((app: any) => app.show_name)))

        return {
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          role: user.role,
          role_display: user.role === 'agent' ? 'Агент' : 'Коммерческий отдел',
          total_applications: userApplications.length,
          approved_applications: approvedByUser.length,
          rejected_applications: rejectedByUser.length,
          revenue: revenue,
          kpi: kpi,
          commission: commission,
          unique_shows: uniqueShows.length,
          shows: uniqueShows.slice(0, 5), // Top 5 shows
        }
      })
      .filter((staff: any) => {
        if (role_filter && role_filter !== 'all') {
          return staff.role === role_filter
        }
        return true
      })
      .sort((a: any, b: any) => b.revenue - a.revenue) // Sort by revenue descending

    // Calculate company totals
    const totalRevenue = approvedApplications.reduce((sum: number, app: any) => {
      return sum + (parseFloat(app.cost) || 0)
    }, 0)

    const uniqueClients = Array.from(new Set(approvedApplications.map((app: any) => app.customer_id)))
    const uniqueShows = Array.from(new Set(approvedApplications.map((app: any) => app.show_name)))

    const companyStats = {
      total_revenue: totalRevenue,
      total_applications: applications.length,
      approved_applications: approvedApplications.length,
      active_clients: uniqueClients.length,
      unique_shows: uniqueShows.length,
      average_deal_size: approvedApplications.length > 0 ? totalRevenue / approvedApplications.length : 0,
      approval_rate: applications.length > 0 ? Math.round((approvedApplications.length / applications.length) * 100) : 0,
    }

    return res.status(200).json({
      staff_kpi: staffKPI,
      company_stats: companyStats,
      period: {
        start_date: start_date || null,
        end_date: end_date || null,
      }
    })

  } catch (error: any) {
    console.error('Director staff KPI API error:', error)
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
}
