const passport        = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool            = require('./db');
const jwt             = require('jsonwebtoken');

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
      let user = rows[0];
      if (!user) {
        const name = profile.displayName;
        const insert = await pool.query(
          `INSERT INTO users (name, email, password, is_validated)
           VALUES ($1, $2, $3, TRUE) RETURNING *`,
          [name, email, '']
        );
        user = insert.rows[0];
      }
      const token = jwt.sign({
        id:       user.id,
        name:     user.name,
        is_admin: user.is_admin
      }, process.env.JWT_SECRET, { expiresIn: '1h' });
      done(null, token);
    } catch (err) {
      done(err);
    }
  }
));
