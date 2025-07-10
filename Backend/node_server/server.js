// server.js (uniquement les lignes clés sont montrées)

const fs   = require('fs');
const path = require('path');
require('dotenv').config();

const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const rateLimit = require('express-rate-limit');
const session  = require('express-session');
const passport = require('passport');
require('./passport');

const authRouter       = require('./routes/auth');
const passwordRouter   = require('./routes/password');
const adminRouter      = require('./routes/admin');
const usersRouter      = require('./routes/users');
const prodRouter       = require('./routes/products');
const blogRouter       = require('./routes/blog');
const statsRouter      = require('./routes/stats');
const auditRouter      = require('./routes/audit');
const visitsRouter     = require('./routes/visits');
const categoriesRouter = require('./routes/categories');
const tagsRouter       = require('./routes/tags');
const reviewsRouter = require('./routes/reviews');

const multer = require('multer');

const app = express();

// Crée le dossier uploads/ s’il n’existe pas
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// — Security & parsing —
app.use(helmet({ contentSecurityPolicy:false, crossOriginResourcePolicy:false }));
app.set('trust proxy', 1);
app.use(express.json());

// CORS global
const allowedOrigins = [
  'http://localhost:3000',
  'https://gaspassdash-front.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS bloqué pour:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));



// rate limiter
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));

// Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' }
}));
app.use(passport.initialize());
app.use(passport.session());

// Spécifique “/uploads” : CORS + static
app.use(
  '/uploads',
  cors({ origin: process.env.FRONTEND_URL, credentials:true }),
  express.static(UPLOAD_DIR)
);

// Ping
app.get('/api/ping', (req, res) => res.json({ ok:true, timestamp: Date.now() }));

// Auth & autres routes
app.use('/api/auth',     authRouter);
app.use('/api/password', passwordRouter);
app.use('/api/admin',    adminRouter);
app.use('/api/users',    usersRouter);
app.use('/api/products', prodRouter);
app.use('/api/reviews', reviewsRouter);

// **— Multer pour l’upload d’une image “fieldname = image” —**
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

// Monte la route "/api/blogs" en insérant Multer avant
app.use('/api/blogs', upload.single('image'), blogRouter);

// CATÉGORIES et TAGS
app.use('/api/categories', categoriesRouter); // catégories pour produits ET /api/categories/blog pour blogs
app.use('/api/tags',       tagsRouter);

app.use('/api/stats',  statsRouter);
app.use('/api/audit',  auditRouter);
app.use('/api/visits', visitsRouter);

// 404 handler
app.use((req, res) => res.status(404).json({ error:'Route introuvable' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status||500).json({ error: err.message||'Erreur serveur' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend on http://localhost:${PORT}`));
