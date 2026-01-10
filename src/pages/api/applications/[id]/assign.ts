import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../../lib/database'

/**
 * POST /api/applications/[id]/assign
 * Assign application to the current agent (take into work)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Application ID is required' })
    }

    // Get current user from token
    const jwt = await import('jsonwebtoken')
    const authHeader = req.headers.authorization || ''
    let token = ''

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key'
    const decoded: any = jwt.verify(token, secret)
    const userId = decoded.userId

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Check if user is an agent
    const user = await db.getUserById(userId)
    if (!user || user.role !== 'agent') {
      return res.status(403).json({ error: 'Only agents can assign applications' })
    }

    // Get application
    const applications = await db.getApplications()
    const application = applications.find((app: any) => app.id === id)

    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    // Check if application is pending
    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Can only assign pending applications' })
    }

    // Check if already assigned to another agent
    if (application.agent_id && application.agent_id !== userId) {
      return res.status(409).json({ error: 'Application already assigned to another agent' })
    }

    // Assign to agent and change status to in_progress
    await db.query(
      `UPDATE applications 
       SET agent_id = $1, status = 'in_progress', updated_at = NOW() 
       WHERE id = $2`,
      [userId, id]
    )

    // Get updated application
    const updatedApplications = await db.getApplications()
    const updatedApplication = updatedApplications.find((app: any) => app.id === id)

    return res.status(200).json(updatedApplication)
  } catch (error) {
    console.error('Error assigning application:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
