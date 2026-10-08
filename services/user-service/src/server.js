const express = require('express');
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcrypt');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SALT_ROUNDS = 10;   // same value as Lab 3.2 — never go below 10

// ── Health check endpoint (required for Docker Compose)
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'user-service', port: 3001 })
);

// ── MySQL connection — same settings as backend/db.js (Lab 3.1)
const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'db',
  user:     process.env.DB_USER     || 'cloudeats_user',
  password: process.env.DB_PASSWORD || 'cloudeats_password',
  database: process.env.DB_NAME     || 'cloudeats_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

// ── POST /api/auth/register  (moved from backend/auth.js, Lab 3.2)
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
    res.status(201).json({
      message: 'Account created successfully',
      userId:  result.insertId
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── POST /api/auth/login  (moved from backend/auth.js, Lab 3.2)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, email, password_hash, full_name FROM users WHERE email = ?',
      [email]
    );
    // Same message for "not found" and "wrong password" (no email enumeration)
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Week 8 will return a JWT here instead
    res.json({
      message:  'Login successful',
      userId:   user.id,
      fullName: user.full_name,
      email:    user.email
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET /api/users/:id  (NEW in Lab 5.1 — Order Service calls this in Part 8)
app.get('/api/users/:id', async (req, res) => {
  try {
    // Never select password_hash here — other services will call this route
    const [rows] = await db.query(
      'SELECT id, email, full_name, phone, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('User lookup error:', err.message);
    res.status(500).json({ error: 'Could not load user' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`[user-service] Running on http://localhost:${PORT}`)
);