USE cloudeats_db; -- Use the database created by Docker Compose environment variables

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  category    VARCHAR(100) NOT NULL,
  price       DECIMAL(10, 2) NOT NULL,
  description TEXT,
  badge       VARCHAR(50),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  available   INT DEFAULT 1  -- 1 = available, 0 = unavailable
);


-- Seed sample menu items (only insert if table is empty)
INSERT IGNORE INTO menu_items (id, name, category, price, description, badge) VALUES
  (1, 'Nasi Lemak Special',    'Breakfast', 12.00, 'Fragrant coconut rice with sambal, fried chicken, egg & peanuts', 'Best Seller'),
  (2, 'Nasi Lemak Regular',    'Breakfast',  8.00, 'Classic nasi lemak with sambal, anchovies & half egg',           NULL),
  (3, 'Roti Canai with Curry', 'Breakfast',  6.00, 'Crispy flaky flatbread with aromatic chicken curry dip',         NULL),
  (4, 'Char Kway Teow',        'Mains',     14.00, 'Stir-fried flat noodles with prawns, egg & bean sprouts',        'New'),
  (5, 'Mee Goreng Mamak',      'Mains',     11.00, 'Yellow noodles fried with tofu, squid & tomato sauce',           NULL),
  (6, 'Teh Tarik',             'Beverages',  3.00, 'Pulled milk tea — sweet, frothy, and perfectly Malaysian',        NULL),
  (7, 'Milo Ais',              'Beverages',  4.00, 'Iced Milo with condensed milk — the Malaysian childhood drink',   NULL);

  -- ── USERS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,        -- No duplicate accounts
  password_hash VARCHAR(255) NOT NULL,               -- NEVER plain text
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),                           -- Optional
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)                           -- Fast login lookup by email
);


-- ── ORDERS TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  total_amount     DECIMAL(10, 2) NOT NULL,
  status           ENUM('pending', 'confirmed', 'preparing', 'delivered', 'cancelled')
                   DEFAULT 'pending',
  delivery_address TEXT,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status  (status)
);