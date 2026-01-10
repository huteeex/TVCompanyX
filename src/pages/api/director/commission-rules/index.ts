import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:0112@localhost:5432/TVShow',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * GET /api/director/commission-rules
 * Returns all commission rules
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify token
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || decoded.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get all commission rules
    const result = await pool.query(`
      SELECT 
        id,
        role,
        base_rate,
        revenue_multiplier,
        tier_1_threshold,
        tier_1_bonus,
        tier_2_threshold,
        tier_2_bonus,
        tier_3_threshold,
        tier_3_bonus,
        created_at,
        updated_at
      FROM commission_rules
      ORDER BY role
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching commission rules:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
