const express    = require('express');
const cors       = require('cors');
const db         = require('./db');
const authRoutes = require('./auth');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── GLOBAL MIDDLEWARE & BASE CONFIG ────────────────
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve HTML/CSS from /public

// ── HEALTH CHECK ───────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cloudeats-backend' });
});

// ════════════════════════════════════════════════════
// 🟢 USER SERVICE ZONE  →  services/user-service/
//    Deps: express · mysql2 · bcrypt · cors
//    DB:   MySQL  (users table)
//    EXISTS today (in auth.js):  POST /register · POST /login
//    NEW in Lab 5.1:             GET /api/users/:id
// ════════════════════════════════════════════════════

app.use('/api/auth', authRoutes);
// app.get('/api/users/:id', ...)

// ════════════════════════════════════════════════════
// 🔵 MENU SERVICE ZONE  →  services/menu-service/
//    Deps: express · mysql2 · cors
//    DB:   MySQL  (menu_items table)
//    EXISTS today (in server.js): GET /api/menu · GET /api/menu/category/:category
//    NEW in Lab 5.1:              GET /api/menu/:id
// ════════════════════════════════════════════════════

// ── GET ALL MENU ITEMS ──────────────────────────────
app.get('/api/menu', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu_items ORDER BY category, name');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Menu fetch error:', err.message);
    res.status(500).json({ success: false, error: 'Could not load menu' });
  }
});

// ── GET MENU BY CATEGORY ───────────────────────────
app.get('/api/menu/category/:category', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM menu_items WHERE category = ? ORDER BY name',
      [req.params.category]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════
// 🟣 ORDER SERVICE ZONE  →  services/order-service/
//    Deps: express · mongodb · redis · cors
//    DB:   MongoDB (orders) + Redis (cart)
//    EXISTS today: nothing — Lab 4.2 used redis-cli and mongosh only
//    NEW in Lab 5.1: cart routes + order routes (all written fresh)
// ════════════════════════════════════════════════════

// ── SERVER START ───────────────────────────────────
app.listen(PORT, () => console.log(`CloudEats backend running on port ${PORT}`));