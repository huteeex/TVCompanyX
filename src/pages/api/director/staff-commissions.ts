import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:0112@localhost:5432/TVShow',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * GET /api/director/staff-commissions
 * Calculate commissions for all staff based on commission rules
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

    // Get staff data with applications and calculate commissions
    const result = await pool.query(`
      WITH staff_stats AS (
        SELECT 
          u.id,
          u.email,
          u.role,
          u.first_name,
          u.middle_name,
          u.last_name,
          COUNT(DISTINCT aa.id) FILTER (WHERE aa.status = 'approved') as approved_applications,
          COALESCE(SUM(aa.cost) FILTER (WHERE aa.status = 'approved'), 0) as total_revenue
        FROM users u
        LEFT JOIN approved_applications aa ON aa.agent_id = u.id
        WHERE u.role IN ('agent', 'commercial') AND u.is_active = true
        GROUP BY u.id, u.email, u.role, u.first_name, u.middle_name, u.last_name
      ),
      commission_calc AS (
        SELECT 
          ss.*,
          cr.base_rate,
          cr.revenue_multiplier,
          cr.tier_1_threshold,
          cr.tier_1_bonus,
          cr.tier_2_threshold,
          cr.tier_2_bonus,
          cr.tier_3_threshold,
          cr.tier_3_bonus,
          CASE 
            WHEN ss.approved_applications >= cr.tier_3_threshold THEN 3
            WHEN ss.approved_applications >= cr.tier_2_threshold THEN 2
            WHEN ss.approved_applications >= cr.tier_1_threshold THEN 1
            ELSE 0
          END as tier,
          CASE 
            WHEN ss.approved_applications >= cr.tier_3_threshold THEN cr.tier_3_bonus
            WHEN ss.approved_applications >= cr.tier_2_threshold THEN cr.tier_2_bonus
            WHEN ss.approved_applications >= cr.tier_1_threshold THEN cr.tier_1_bonus
            ELSE 0
          END as tier_bonus
        FROM staff_stats ss
        LEFT JOIN commission_rules cr ON cr.role = ss.role
      )
      SELECT 
        id,
        email,
        role,
        first_name,
        middle_name,
        last_name,
        approved_applications,
        total_revenue,
        base_rate,
        tier,
        tier_bonus,
        (base_rate + tier_bonus) as commission_rate,
        ROUND((total_revenue * (base_rate + tier_bonus) / 100.0)::numeric, 2) as total_commission
      FROM commission_calc
      ORDER BY total_commission DESC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error calculating staff commissions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
