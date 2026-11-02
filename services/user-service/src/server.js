const express = require('express');
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcryptjs');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');   
const logger  = require('./config/logger');
const morganMiddleware = require('./config/morganLogger');

// Fail fast instead of signing tokens with an undefined secret
if (!process.env.JWT_SECRET) {
  console.error('[user-service] JWT_SECRET is not set — exiting');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(morganMiddleware);

const SALT_ROUNDS = 10;   // same value as Lab 3.2 — never go below 10

// ── Health check endpoint (required for Docker Compose)
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'user-service', port: 3001 })
);

// ── MySQL connection ──────────────────────────────────
const db = mysql.createPool({
  host:       process.env.DB_HOST     || 'db',
  user:       process.env.DB_USER     || 'cloudeats_user',
  password:   process.env.DB_PASSWORD || 'cloudeats_password',
  database:   process.env.DB_NAME     || 'cloudeats_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

// ── POST /api/auth/register ───────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, phone } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, full_name, phone) VALUES (?, ?, ?, ?)',
      [email, password_hash, full_name, phone || null]
    );
    logger.info('User registered', { userId: result.insertId, email });
    res.status(201).json({
      message: 'Account created successfully',
      userId:  result.insertId
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      logger.warn('Registration failed - duplicate email', { email });
      return res.status(409).json({ error: 'Email already registered' });
    }
    logger.error('Registration error', { error: err.message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── POST /api/auth/login ──────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = ?',
      [email]
    );

    // Same message for "not found" and "wrong password" (no email enumeration)
    if (rows.length === 0) {
      logger.warn('Login failed - unknown email', { email, ip: req.headers['x-forwarded-for'] || req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      logger.warn('Login failed - wrong password', { email, ip: req.headers['x-forwarded-for'] || req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logger.info('User login successful', { userId: user.id, email });

    // Payload = who this user is. Never put password data in a token.
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.full_name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message:  'Login successful',
      token,
      role:     user.role,
      userId:   user.id,
      fullName: user.full_name,
      email:    user.email
    });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET /api/users/:id ────────────────────────────────
app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, email, full_name, phone, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    logger.error('User lookup error', { error: err.message });
    res.status(500).json({ error: 'Could not load user' });
  }
});

// ── ADMIN ROUTES ──────────────────────────────────────
const ROLES = ['customer', 'owner', 'admin'];

// GET /api/admin/users
app.get('/api/admin/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, email, full_name, role, created_at FROM users ORDER BY id'
    );
    res.json({ users: rows });
  } catch (err) {
    logger.error('Admin list error', { error: err.message });
    res.status(500).json({ error: 'Could not list users' });
  }
});

// GET /api/admin/stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT role, COUNT(*) AS n FROM users GROUP BY role');
    const byRole = {};
    rows.forEach(r => { byRole[r.role] = r.n; });
    res.json({ totalUsers: rows.reduce((a, r) => a + r.n, 0), byRole, requestedBy: req.headers['x-user-email'] });
  } catch (err) {
    logger.error('Admin stats error', { error: err.message });
    res.status(500).json({ error: 'Could not load stats' });
  }
});

// PATCH /api/admin/users/:id/role
app.patch('/api/admin/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'role must be one of: ' + ROLES.join(', ') });
  }
  try {
    const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Role updated', userId: Number(req.params.id), role });
  } catch (err) {
    logger.error('Admin role error', { error: err.message });
    res.status(500).json({ error: 'Could not update role' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () =>
  logger.info('user-service started', { port: PORT })
);