const express = require('express');
const { MongoClient } = require('mongodb');
const redis   = require('redis');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const CART_TTL = 3600;   // seconds — carts expire after 1 hour (Lab 4.2: SET ... EX)

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'order-service', port: 3003 })
);

// ── MongoDB connection (database name matches Lab 4.2: cloudeats_db)
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017';
const mongoClient = new MongoClient(MONGO_URL);
let ordersDb;
mongoClient.connect()
  .then(() => {
    ordersDb = mongoClient.db('cloudeats_db');
    console.log('[order-service] MongoDB connected');
  })
  .catch(err => console.error('[order-service] MongoDB error:', err.message));

// ── Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.on('error', err => console.error('[order-service] Redis error:', err.message));
redisClient.connect()
  .then(() => console.log('[order-service] Redis connected'))
  .catch(err => console.error('[order-service] Redis connect failed:', err.message));

// ── Helpers
const cartKey   = (userId) => `cart:user${userId}`;            // e.g. cart:user1 (Lab 4.2)
const calcTotal = (items) =>
  Math.round(items.reduce((sum, i) => sum + i.qty * i.price, 0) * 100) / 100;

// ── GET /api/cart/:userId  — read the cart from Redis
app.get('/api/cart/:userId', async (req, res) => {
  try {
    const raw = await redisClient.get(cartKey(req.params.userId));
    res.json(raw ? JSON.parse(raw) : { items: [], total: 0 });
  } catch (err) {
    console.error('Cart read error:', err.message);
    res.status(500).json({ error: 'Could not read cart' });
  }
});

// ── POST /api/cart/:userId/items  — add an item   body: { name, qty, price }
app.post('/api/cart/:userId/items', async (req, res) => {
  const { name, qty, price } = req.body;
  if (!name || !(qty > 0) || !(price >= 0)) {
    return res.status(400).json({ error: 'name, qty (> 0) and price are required' });
  }

  try {
    const key  = cartKey(req.params.userId);
    const raw  = await redisClient.get(key);
    const cart = raw ? JSON.parse(raw) : { items: [], total: 0 };

    const existing = cart.items.find(i => i.name === name);
    if (existing) existing.qty += qty;
    else cart.items.push({ name, qty, price });

    cart.total = calcTotal(cart.items);
    await redisClient.set(key, JSON.stringify(cart), { EX: CART_TTL });
    res.status(201).json(cart);
  } catch (err) {
    console.error('Cart write error:', err.message);
    res.status(500).json({ error: 'Could not update cart' });
  }
});

// ── POST /api/orders  — checkout   body: { userId, items? }  (items default to the cart)
app.post('/api/orders', async (req, res) => {
  const userId = Number(req.body.userId);
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!ordersDb) {
    return res.status(503).json({ error: 'Order database not ready' });
  }



   // ── Part 8 (Advanced): verify the user exists by asking the User Service
  try {
    const userRes = await fetch(
      `http://user-service:3001/api/users/${userId}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (userRes.status === 404) {
      return res.status(404).json({
        error: 'User not found',
        hint:  'Order Service checked User Service'
      });
    }
    if (!userRes.ok) {
      return res.status(502).json({ error: 'User Service returned an error' });
    }
  } catch (err) {
    return res.status(503).json({ error: 'User Service unreachable' });
  }


  try {
    let items = req.body.items;
    if (!items) {
      const raw = await redisClient.get(cartKey(userId));
      items = raw ? JSON.parse(raw).items : [];
    }
    if (!items.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const now   = new Date();
    const order = {
      userId,
      items,
      total:         calcTotal(items),
      status:        'pending',
      placedAt:      now,
      statusHistory: [{ status: 'pending', at: now }]
    };
    const result = await ordersDb.collection('orders').insertOne(order);

    // Checkout: the cart (temporary, Redis) becomes an order (permanent, MongoDB)
    await redisClient.del(cartKey(userId));

    res.status(201).json({
      message: 'Order placed',
      orderId: result.insertedId,
      total:   order.total
    });
  } catch (err) {
    console.error('Order create error:', err.message);
    res.status(500).json({ error: 'Could not place order' });
  }
});

// ── GET /api/orders/user/:userId  — order history from MongoDB
app.get('/api/orders/user/:userId', async (req, res) => {
  if (!ordersDb) {
    return res.status(503).json({ error: 'Order database not ready' });
  }
  try {
    const orders = await ordersDb.collection('orders')
      .find({ userId: Number(req.params.userId) })
      .sort({ placedAt: -1 })
      .toArray();
    res.json(orders);
  } catch (err) {
    console.error('Order history error:', err.message);
    res.status(500).json({ error: 'Could not load orders' });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () =>
  console.log(`[order-service] Running on http://localhost:${PORT}`)
);