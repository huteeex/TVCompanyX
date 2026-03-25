const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:0112@localhost:5432/tvshow' });
const users = [
  { email: 'it@g.com',  pass: 'Admin123!' },
  { email: 'zak@g.com', pass: 'Customer123!' },
  { email: 'ag1@g.com', pass: 'Agent123!' },
  { email: 'com@g.com', pass: 'Commercial123!' },
  { email: 'dir@g.com', pass: 'Director123!' },
  { email: 'buh@g.com', pass: 'Accountant123!' },
];
(async () => {
  for (const u of users) {
    const h = await bcrypt.hash(u.pass, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE email=$2', [h, u.email]);
    console.log('Updated:', u.email, '=>', u.pass);
  }
  pool.end();
})().catch(e => { console.error(e.message); pool.end(); });
