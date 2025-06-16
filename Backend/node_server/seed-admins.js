require('dotenv').config(); 
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PEPPER = process.env.PEPPER;
const raw = process.env.ADMIN_CREDENTIALS || '';

async function seed() {
  const creds = raw
    .split(';')
    .map((item, index) => {
      const [username, password] = item.split(':');
      // Générer un numéro de téléphone fictif unique par admin
      const phone = `69000000${index + 1}`;
      return { username, password, phone };
    })
    .filter(c => c.username && c.password);

  for (const { username, password, phone } of creds) {
    const hash = await bcrypt.hash(password + PEPPER, 12);

    await pool.query(
      `INSERT INTO users (username, phone, password, is_admin, is_validated)
       VALUES ($1, $2, $3, TRUE, TRUE)
       ON CONFLICT (username) DO NOTHING`,
      [username, phone, hash]
    );

    console.log(`✅ Admin seedé: ${username}`);
  }

  await pool.end();
}

seed().catch(err => {
  console.error('❌ Erreur lors du seed des administrateurs:', err);
  process.exit(1);
});
