const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 3001;

const USERS_FILE = path.join(__dirname, 'users.json');
const LOGS_FILE = path.join(__dirname, 'logs.json');

app.use(cors());
app.use(express.json());

// Helper: load/save JSON
function load(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}
function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- Auth ---
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const users = load(USERS_FILE, []);
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'User exists' });
  const hash = bcrypt.hashSync(password, 8);
  users.push({ username, password: hash });
  save(USERS_FILE, users);
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = load(USERS_FILE, []);
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ ok: true });
});

// --- Logs (per user) ---
app.get('/api/logs', (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'No user' });
  const logs = load(LOGS_FILE, {});
  res.json(logs[username] || { exercises: [], logs: [] });
});

app.post('/api/logs', (req, res) => {
  const { username, data } = req.body;
  if (!username || !data) return res.status(400).json({ error: 'Missing' });
  const logs = load(LOGS_FILE, {});
  logs[username] = data;
  save(LOGS_FILE, logs);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));