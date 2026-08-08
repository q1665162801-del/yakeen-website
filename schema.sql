-- ponytail: D1 schema for Yakeen admin — 3 tables, zero abstractions
-- Run: npx wrangler d1 execute yakeen-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  company TEXT DEFAULT '',
  country TEXT DEFAULT '',
  product TEXT DEFAULT '',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK(status IN ('new','read','replied','archived')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);

-- ponytail: products table — complex fields as JSON text, no joins
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'indoor',
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  main_image TEXT NOT NULL DEFAULT '',
  gallery_images TEXT NOT NULL DEFAULT '[]',
  scene_image TEXT NOT NULL DEFAULT '',
  specs TEXT NOT NULL DEFAULT '{}',
  applications TEXT NOT NULL DEFAULT '[]',
  features TEXT NOT NULL DEFAULT '[]',
  faqs TEXT NOT NULL DEFAULT '[]',
  case_study TEXT NOT NULL DEFAULT '{}',
  ar TEXT DEFAULT '',
  featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ponytail: content table — editable page sections, key-value style
CREATE TABLE IF NOT EXISTS content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_key TEXT UNIQUE NOT NULL,
  section TEXT NOT NULL DEFAULT 'main',
  content TEXT NOT NULL DEFAULT '',
  ar_content TEXT DEFAULT '',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_page ON content(page_key);
