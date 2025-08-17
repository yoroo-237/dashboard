// Script pour vérifier la présence d'un utilisateur en base
require('dotenv').config();
const pool = require('./db');

(async () => {
  const username = 'adminM';
  const phone = '';
  try {
    const { rows } = await pool.query(
      'SELECT id, username, phone, is_validated, is_admin FROM users WHERE username=$1 OR phone=$2',
      [username, phone]
    );
    if (rows.length) {
      console.log('Utilisateur trouvé :', rows[0]);
    } else {
      console.log('Utilisateur non trouvé.');
    }
  } catch (err) {
    console.error('Erreur lors de la vérification :', err);
  } finally {
    await pool.end();
  }
})();
