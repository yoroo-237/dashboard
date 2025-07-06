// server.js

const fs        = require('fs');
const path      = require('path');
require('dotenv').config();

const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const session   = require('express-session');
const passport  = require('passport');
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
const reviewsRouter    = require('./routes/reviews');

const multer = require('multer');

const app = express();

// ───────────
// Uploads dir
// ───────────
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ────────────────────
// Security & parsing
// ────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));
app.set('trust proxy', 1);
app.use(express.json());

// ───────────
// CORS global
// ───────────
app.use(cors({
  origin: "https://dashboard-gaspass.onrender.com" ,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ───────────
// Rate limiter
// ───────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// ────────────────────
// Session & Passport
// ────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// ────────────────────────────────
// Static uploads folder w/ CORS
// ────────────────────────────────
app.use(
  '/uploads',
  cors({ origin: process.env.FRONTEND_URL, credentials: true }),
  express.static(UPLOAD_DIR)
);

// ─────────────
// Ping route
// ─────────────
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// ─────────────────────────
// Routes without file upload
// ─────────────────────────
app.use('/api/auth',     authRouter);
app.use('/api/password', passwordRouter);
app.use('/api/admin',    adminRouter);
app.use('/api/users',    usersRouter);
app.use('/api/products', prodRouter);
app.use('/api/reviews',  reviewsRouter);

// ─────────────────────────────────────────
// Multer configuration for blog image upload
// ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

// Mount blog routes with Multer middleware
app.use('/api/blogs', upload.single('image'), blogRouter);

// ───────────────
// Categories & tags
// ───────────────
app.use('/api/categories', categoriesRouter);
app.use('/api/tags',       tagsRouter);

// ──────────
// Stats, audit, visits
// ──────────
app.use('/api/stats',  statsRouter);
app.use('/api/audit',  auditRouter);
app.use('/api/visits', visitsRouter);

// ───────────────
// 404 handler
// ───────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// ───────────────
// Error handler
// ───────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
});

// ────────────────────
// Server startup
// ────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur le port ${PORT}`);
});
