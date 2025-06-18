// backend/routes/auth.js

const express   = require('express');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const Joi       = require('joi');
const pool      = require('../db');
const validate  = require('../middleware/validate'); // middleware existant
const router    = express.Router();
const loginSchema = Joi.object({
  identifier: Joi.string().required(), // username ou phone
  password:   Joi.string().required()
});

// --- Schéma Joi renforcé pour signup ---
const signupSchema = Joi.object({
  username: Joi.string()
                .alphanum()
                .min(3)
                .max(30)
                .required()
                .messages({
                  'string.alphanum': 'Le nom d’utilisateur doit être alphanumérique.',
                  'string.min': 'Le nom d’utilisateur doit faire au moins 3 caractères.'
                }),
  phone:    Joi.string()
                .pattern(/^6\d{8}$/)
                .required()
                .messages({
                  'string.pattern.base': 'Le numéro doit être un numéro camerounais valide (commence par 6 et 9 autres chiffres).'
                }),
  password: Joi.string()
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)
                .required()
                .messages({
                  'string.pattern.base': 'Le mot de passe doit faire ≥8 caractères et contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.'
                })
});
router.post('/login',
  validate(loginSchema),
  async (req, res) => {
    const { identifier, password } = req.body;
    const PEPPER = process.env.PEPPER;

    // 1) Détecter si identifier = phone ou username
    const isPhone = /^\+\d{8,15}$/.test(identifier);
    const field   = isPhone ? 'phone' : 'username';

    // 2) Récupérer l’utilisateur
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE ${field} = $1`, [identifier]
    );
    const user = rows[0];
    if (!user) return res.status(400).json({ error: 'Utilisateur non trouvé' });

    // 3) Vérifier le mot de passe
    const match = await bcrypt.compare(password + PEPPER, user.password);
    if (!match) return res.status(400).json({ error: 'Mot de passe incorrect' });

    // 4) Vérifier validation + admin
    if (!user.is_validated && !user.is_admin)
      return res.status(403).json({ error: 'Compte en attente de validation' });

    // 5) Générer le JWT
    const token = jwt.sign({
      id:       user.id,
      phone:     user.phone,
      username: user.username,
      is_admin: user.is_admin
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 6) Réponse
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id:        user.id,
        username:  user.username,
        phone:     user.phone,
        is_admin:  user.is_admin
      }
    });
  }
);

// --- Route Signup ---
router.post('/signup',
  validate(signupSchema),
  async (req, res) => {
    const {  username, phone, password } = req.body;

    try {
      // 1) Vérifier unicité
      const { rowCount } = await pool.query(
        'SELECT 1 FROM users WHERE username=$1 OR phone=$2',
        [username, phone]
      );
      if (rowCount) {
        return res.status(409).json({ error: 'Nom d’utilisateur ou numéro déjà utilisé.' });
      }

      // 2) Hasher le mot de passe
      const hash = await bcrypt.hash(password + process.env.PEPPER, 12);

      // 3) Insérer
      const { rows } = await pool.query(
        `INSERT INTO users (username, phone, password)
         VALUES ($1,$2,$3)
         RETURNING id, username, phone, is_validated, is_admin`,
        [ username, phone, hash]
      );

      res.status(201).json({
        message: 'Inscription réalisée (en attente de validation).',
        user: rows[0]
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
);

module.exports = router;
