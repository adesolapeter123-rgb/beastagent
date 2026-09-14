const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const MENU_FILE = path.join(__dirname, 'data', 'menu.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const DELIVERY_FEE = 700;

const STATUS_FLOW = ['received', 'preparing', 'out for delivery', 'delivered'];

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8') || '[]');
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function getMenu() {
  return readJSON(MENU_FILE);
}
function getOrders() {
  return readJSON(ORDERS_FILE);
}
function saveOrders(orders) {
  writeJSON(ORDERS_FILE, orders);
}

// ---- Frontend entry point ----
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'beastagent-api' });
});

// ---- Menu ----
app.get('/api/snacks', (req, res) => {
  res.json(getMenu());
});

// ---- Create an order ----
app.post('/api/orders', (req, res) => {
  const { items, customer } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your ticket is empty.' });
  }
  if (!customer || !customer.name || !customer.phone || !customer.address) {
    return res.status(400).json({ error: 'Name, phone and delivery address are all required.' });
  }

  const menu = getMenu();
  let subtotal = 0;
  const lineItems = [];

  for (const item of items) {
    const snack = menu.find((s) => s.id === item.id);
    if (!snack) {
      return res.status(400).json({ error: `Unknown item: ${item.id}` });
    }
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: `Invalid quantity for ${snack.name}.` });
    }
    // Prices are always taken from the server's menu, never trusted from the client.
    subtotal += snack.price * qty;
    lineItems.push({ id: snack.id, name: snack.name, price: snack.price, qty });
  }

  const delivery = DELIVERY_FEE;
  const total = subtotal + delivery;

  const order = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: STATUS_FLOW[0],
    items: lineItems,
    subtotal,
    delivery,
    total,
    customer: {
      name: String(customer.name).trim(),
      phone: String(customer.phone).trim(),
      address: String(customer.address).trim(),
    },
  };

  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);

  res.status(201).json(order);
});

// ---- Look up a single order ----
app.get('/api/orders/:id', (req, res) => {
  const order = getOrders().find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
});

// ---- List all orders (simple admin view) ----
app.get('/api/orders', (req, res) => {
  const orders = getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

// ---- Advance an order's status (simple admin action) ----
app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!STATUS_FLOW.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUS_FLOW.join(', ')}` });
  }
  const orders = getOrders();
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  order.status = status;
  saveOrders(orders);
  res.json(order);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BeastAgent API running on http://localhost:${PORT}`);
});
