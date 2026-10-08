const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('./db');

const router = express.Router();
const SALT_ROUNDS = 10;   // 2^10 = 1024 rounds — never go below 10

// ── POST /api/auth/register ──────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone } = req.body;

  // Input validation
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Hash the password — ~100ms intentional delay (SALT_ROUNDS = 10)
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert into database — plain text password is now discarded
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, full_name, phone) VALUES (?, ?, ?, ?)',
      [email, password_hash, full_name, phone || null]
    );

    res.status(201).json({
      message: 'Account created successfully',
      userId:  result.insertId
    });

  } catch (err) {
    // ER_DUP_ENTRY: email already registered (UNIQUE constraint)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Lookup user by email (fast — INDEX on email)
    const [rows] = await db.query(
      'SELECT id, email, password_hash, full_name FROM users WHERE email = ?',
      [email]
    );

    // Use same error message for "not found" and "wrong password"
    // (prevents email enumeration attacks)
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // bcrypt.compare re-hashes the submitted password and compares
    // It does NOT decrypt the stored hash
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Login successful — Week 8 will return a JWT token here instead
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

module.exports = router;