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
    
    // Check if user is accountant
    if (decoded.role !== 'accountant') {
      return res.status(403).json({ error: 'Access denied. Accountant role required.' })
    }

    // Get query parameters
    const { status, customer_id, start_date, end_date } = req.query

    // Fetch applications with optional filters
    let applications = await db.getApplications()

    // Filter by status (default to approved)
    const statusFilter = status ? String(status) : 'approved'
    applications = applications.filter((app: any) => app.status === statusFilter)

    // Filter by customer if specified
    if (customer_id) {
      applications = applications.filter((app: any) => app.customer_id === customer_id)
    }

    // Filter by date range if specified
    if (start_date || end_date) {
      applications = applications.filter((app: any) => {
        const appDate = new Date(app.created_at)
        
        if (start_date && end_date) {
          const start = new Date(String(start_date))
          start.setHours(0, 0, 0, 0) // Начало дня
          
          const end = new Date(String(end_date))
          end.setHours(23, 59, 59, 999) // Конец дня
          
          return appDate >= start && appDate <= end
        } else if (start_date) {
          const start = new Date(String(start_date))
          start.setHours(0, 0, 0, 0)
          return appDate >= start
        } else if (end_date) {
          const end = new Date(String(end_date))
          end.setHours(23, 59, 59, 999)
          return appDate <= end
        }
        return true
      })
    }

    // Format response
    const formattedApplications = applications.map((app: any) => ({
      id: app.id,
      customer_id: app.customer_id,
      customer_name: app.customer_name,
      customer_email: app.customer_email,
      agent_id: app.agent_id,
      agent_name: app.agent_name,
      show_id: app.show_id,
      show_name: app.show_name,
      commercial_id: app.commercial_id,
      duration_seconds: app.duration_seconds,
      scheduled_at: app.scheduled_at,
      time_slot: app.time_slot,
      cost: parseFloat(app.cost) || 0,
      status: app.status,
      rejection_reason: app.rejection_reason,
      created_at: app.created_at,
      updated_at: app.updated_at,
    }))

    return res.status(200).json({
      applications: formattedApplications,
      total: formattedApplications.length,
    })

  } catch (error: any) {
    console.error('Accountant applications API error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    
    return res.status(500).json({ error: 'Failed to fetch applications' })
  }
}
