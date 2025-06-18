// mailer.js

require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify(err => {
  if (err) {
    console.error('❌ SMTP error:', err);
  } else {
    console.log('✅ SMTP prêt à envoyer des emails');
  }
});

module.exports = transporter;
