// Script pour créer un utilisateur test avec le bon PEPPER
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');

(async () => {
  const username = 'MKO-2';
  const phone = '+237600000000';
  const password = 'Mkomegmbdysdia4';
  const PEPPER = process.env.PEPPER;
  const hash = await bcrypt.hash(password + PEPPER, 12);

  try {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM users WHERE username=$1 OR phone=$2',
      [username, phone]
    );
    if (rowCount) {
      console.log('Utilisateur déjà existant.');
      process.exit(0);
    }
    const { rows } = await pool.query(
      `INSERT INTO users (username, phone, password, is_validated, is_admin)
       VALUES ($1, $2, $3, TRUE, TRUE)
       RETURNING id, username, phone, is_validated, is_admin`,
      [username, phone, hash]
    );
    console.log('Utilisateur test créé :', rows[0]);
  } catch (err) {
    console.error('Erreur lors de la création :', err);
  } finally {
    await pool.end();
  }
})();
