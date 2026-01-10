import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:0112@localhost:5432/TVShow',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * PUT /api/director/commission-rules/:id
 * Update commission rule
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    const { id } = req.query;
    const {
      base_rate,
      revenue_multiplier,
      tier_1_threshold,
      tier_1_bonus,
      tier_2_threshold,
      tier_2_bonus,
      tier_3_threshold,
      tier_3_bonus,
    } = req.body;

    // Validate input
    if (
      base_rate === undefined ||
      revenue_multiplier === undefined ||
      tier_1_threshold === undefined ||
      tier_1_bonus === undefined ||
      tier_2_threshold === undefined ||
      tier_2_bonus === undefined ||
      tier_3_threshold === undefined ||
      tier_3_bonus === undefined
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update commission rule
    const result = await pool.query(
      `
      UPDATE commission_rules
      SET 
        base_rate = $1,
        revenue_multiplier = $2,
        tier_1_threshold = $3,
        tier_1_bonus = $4,
        tier_2_threshold = $5,
        tier_2_bonus = $6,
        tier_3_threshold = $7,
        tier_3_bonus = $8,
        updated_at = now()
      WHERE id = $9
      RETURNING *
      `,
      [
        base_rate,
        revenue_multiplier,
        tier_1_threshold,
        tier_1_bonus,
        tier_2_threshold,
        tier_2_bonus,
        tier_3_threshold,
        tier_3_bonus,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commission rule not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating commission rule:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
