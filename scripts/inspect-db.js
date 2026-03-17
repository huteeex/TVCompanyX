const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:0112@localhost:5432/tvshow' });

async function main() {
  await c.connect();

  // 1. List all tables
  const tables = await c.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  console.log('=== TABLES ===');
  tables.rows.forEach(r => console.log(r.table_name));

  // 2. For each table, show columns
  console.log('\n=== COLUMNS ===');
  for (const row of tables.rows) {
    const cols = await c.query(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [row.table_name]);
    console.log(`\n-- ${row.table_name} --`);
    cols.rows.forEach(col => {
      let type = col.data_type;
      if (col.character_maximum_length) type += `(${col.character_maximum_length})`;
      console.log(`  ${col.column_name} ${type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default || ''}`);
    });
  }

  // 3. Show foreign keys
  console.log('\n=== FOREIGN KEYS ===');
  const fks = await c.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name, kcu.column_name
  `);
  fks.rows.forEach(fk => {
    console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name} ON UPDATE ${fk.update_rule} ON DELETE ${fk.delete_rule}`);
  });

  // 4. Row counts
  console.log('\n=== ROW COUNTS ===');
  for (const row of tables.rows) {
    const cnt = await c.query(`SELECT COUNT(*) as cnt FROM "${row.table_name}"`);
    console.log(`  ${row.table_name}: ${cnt.rows[0].cnt} rows`);
  }

  await c.end();
}

main().catch(e => { console.error(e.message); c.end(); });
