import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// simple request logger to help debug routing
app.use((req, res, next) => {
  // eslint-disable-next-line no-console
  console.log('REQ', req.method, req.path);
  next();
});

// Simple in-memory products and analytics stores (demo only)
let products = [];
const analytics = { totalVisits: 0, perRoute: {} };

// load remote products once on startup
(async function loadRemote() {
  try {
    const res = await fetch('https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json');
    if (res.ok) {
      const data = await res.json();
        products = Array.isArray(data) ? data : [];
        // normalize inventory/price
        products = products.map((p) => ({
          ...p,
          priceCents: typeof p.priceCents === 'number' ? p.priceCents : Math.round((p.price || 0) * 100),
          inventory: typeof p.inventory === 'number' ? p.inventory : 10,
        }));
      console.log('Loaded remote products:', products.length);
    }
  } catch (err) {
    console.warn('Could not load remote products', err);
  }
})();

// middleware to count visits per route
app.use((req, res, next) => {
  analytics.totalVisits += 1;
  analytics.perRoute[req.path] = (analytics.perRoute[req.path] || 0) + 1;
  next();
});

// In-memory demo user store. Replace with a database in production.
const users = [{ email: 'demo@etc.com', password: 'demo123', name: 'Demo User' },{ email: 'admin@etc.com', password: 'admin123', name: 'Admin User' }];

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '2h' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000,
  });

  res.json({ ok: true, user: { email: user.email, name: user.name } });
});

app.get('/api/me', (req, res) => {
  const token = req.cookies && req.cookies.token;
  if (!token) return res.json({ user: null });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ user: payload });
  } catch (err) {
    return res.status(401).json({ user: null });
  }
});

app.post('/api/logout', (_req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true });
});

// public products endpoint (returns merged in-memory products)
app.get('/api/products', (_req, res) => {
  res.json(products);
});

// Admin: list products with inventory
app.get('/api/admin/products', requireAdmin, (_req, res) => {
  res.json({ products });
});

// admin middleware - verifies token and admin email
function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // simple admin check: admin@etc.com is admin
    if (payload && payload.email === 'admin@etc.com') {
      req.user = payload;
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin: add product
app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { name, image, price, category, subCategory, description } = req.body || {};
  if (!name || typeof price !== 'number') return res.status(400).json({ error: 'Missing fields' });
  const id = `p_${Date.now()}`;
  const p = {
    id,
    image: image || '',
    name,
    rating: { stars: 0, count: 0 },
    priceCents: Math.round(price * 100),
    category: category || 'uncategorized',
    subCategory: subCategory || '',
    keywords: [],
    description: description || '',
    inventory: typeof req.body.inventory === 'number' ? req.body.inventory : 0,
  };
  products.unshift(p);
  res.json({ ok: true, product: p });
});

// Admin: update inventory for a product
app.put('/api/admin/products/:id/inventory', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { inventory } = req.body || {};
  if (typeof inventory !== 'number') return res.status(400).json({ error: 'Inventory must be a number' });
  const idx = products.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products[idx].inventory = inventory;
  res.json({ ok: true, product: products[idx] });
});

// Admin: delete a product
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = products.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  const removed = products.splice(idx, 1)[0];
  res.json({ ok: true, product: removed });
});

// Admin: apply discount percentage to multiple products
app.post('/api/admin/products/discount', requireAdmin, (req, res) => {
  const { ids, discountPercent } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids must be a non-empty array' });
  const pct = Number(discountPercent);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return res.status(400).json({ error: 'discountPercent must be a number between 0 and 100' });

  const updated = [];
  ids.forEach((id) => {
    const idx = products.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) return;
    const p = products[idx];
    // ensure base priceCents exists
    p.priceCents = typeof p.priceCents === 'number' ? p.priceCents : Math.round((p.price || 0) * 100);
    if (pct === 0) {
      // remove discount
      delete p.discountPercent;
      delete p.salePriceCents;
    } else {
      p.discountPercent = pct;
      p.salePriceCents = Math.round(p.priceCents * (100 - pct) / 100);
    }
    updated.push(p);
  });

  res.json({ ok: true, updated });
});

// Temporary: unauthenticated test route for applying discounts (use only in dev)
app.post('/api/admin/products/discount-test', (req, res) => {
  const { ids, discountPercent } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids must be a non-empty array' });
  const pct = Number(discountPercent);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return res.status(400).json({ error: 'discountPercent must be a number between 0 and 100' });

  // apply same logic but without auth for debugging
  const updated = [];
  ids.forEach((id) => {
    const idx = products.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) return;
    const p = products[idx];
    p.priceCents = typeof p.priceCents === 'number' ? p.priceCents : Math.round((p.price || 0) * 100);
    if (pct === 0) {
      delete p.discountPercent;
      delete p.salePriceCents;
    } else {
      p.discountPercent = pct;
      p.salePriceCents = Math.round(p.priceCents * (100 - pct) / 100);
    }
    updated.push(p);
  });

  // eslint-disable-next-line no-console
  console.log('Applied test discount to ids=', ids, 'pct=', pct);
  res.json({ ok: true, updated });
});

// Admin: simple analytics
app.get('/api/admin/analytics', requireAdmin, (_req, res) => {
  res.json({ stats: { totalProducts: products.length, ...analytics } });
});

// debug: simple unauthenticated POST endpoint to verify routing
app.post('/debug/hello', (req, res) => {
  // eslint-disable-next-line no-console
  console.log('debug/hello called');
  res.json({ ok: true, now: Date.now() });
});

// print registered routes for debugging
function listRoutes() {
  try {
    // @ts-ignore
    const stack = app._router && app._router.stack ? app._router.stack : [];
    // eslint-disable-next-line no-console
    console.log('Registered routes:');
    stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        // eslint-disable-next-line no-console
        console.log(Object.keys(layer.route.methods).join(','), layer.route.path);
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Could not list routes', err);
  }
}

listRoutes();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Auth server running on http://localhost:${PORT}`);
});
