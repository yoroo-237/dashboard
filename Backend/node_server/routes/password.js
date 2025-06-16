const express = require('express');
const crypto  = require('crypto');
const pool    = require('../db');
const bot     = require('../utils/telegram');
const Joi     = require('joi');
const validate= require('../middleware/validate');
const router  = express.Router();

const forgotSchema = Joi.object({ telegramId: Joi.string().required() });
const resetSchema  = Joi.object({
  token:       Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

// FORGOT via Telegram
router.post('/forgot-telegram', validate(forgotSchema), async (req, res) => {
  const { telegramId } = req.body;
  const { rows } = await pool.query(
    'SELECT reset_expires FROM users WHERE telegram_id=$1', [telegramId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Utilisateur inconnu' });
  if (rows[0].reset_expires > Date.now())
    return res.status(429).json({ error: 'Déjà demandé récemment' });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 3600_000;
  await pool.query(
    `UPDATE users SET reset_token=$1, reset_expires=$2 WHERE telegram_id=$3`,
    [token, expires, telegramId]
  );
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  try {
    await bot.sendMessage(telegramId, `Réinitialisez votre mot de passe: ${link}`);
    res.json({ message: 'Lien envoyé sur Telegram' });
  } catch {
    res.status(500).json({ error: 'Impossible d’envoyer sur Telegram' });
  }
});

// RESET via token
router.post('/reset', validate(resetSchema), async (req, res) => {
  const { token, newPassword } = req.body;
  const { rows } = await pool.query(
    'SELECT id,reset_expires FROM users WHERE reset_token=$1', [token]
  );
  const user = rows[0];
  if (!user || user.reset_expires < Date.now())
    return res.status(400).json({ error: 'Token invalide ou expiré' });

  const hash = await require('bcrypt').hash(newPassword + process.env.PEPPER, 12);
  await pool.query(
    `UPDATE users SET password=$1, reset_token=NULL, reset_expires=NULL WHERE id=$2`,
    [hash, user.id]
  );
  res.json({ message: 'Mot de passe réinitialisé' });
});

module.exports = router;
