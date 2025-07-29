const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

// Ensure data directory and files exist
const uidPath = './data/uids.json';
const logPath = './data/logs.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(uidPath)) fs.writeFileSync(uidPath, '[]');
if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, '[]');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper functions
const readJSON = (path) => {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`Error reading ${path}:`, err);
    return [];
  }
};

const writeJSON = (path, data) =>
  fs.writeFileSync(path, JSON.stringify(data, null, 2));

// Routes

// Get UID list
app.get('/uids', (req, res) => {
  const uids = readJSON(uidPath);
  res.json(uids);
});

// Add new UID
app.post('/uids', (req, res) => {
  const uids = readJSON(uidPath);
  let { uid, state } = req.body;

  if (!uid || !state)
    return res.status(400).send('UID and state are required');

  uid = uid.toUpperCase();

  if (uids.find((u) => u.uid === uid))
    return res.status(409).send('UID already exists');

  uids.push({ uid, state, time: new Date().toISOString() });
  writeJSON(uidPath, uids);
  res.status(201).send('UID added');
});

// Delete UID
app.delete('/uids/:uid', (req, res) => {
  const uid = req.params.uid;
  const uids = readJSON(uidPath);
  const updated = uids.filter((u) => u.uid !== uid);
  writeJSON(uidPath, updated);
  res.sendStatus(200);
});

// Get logs
app.get('/logs', (req, res) => {
  const logs = readJSON(logPath);
  res.json(logs);
});

// Add log from ESP32 or Web
app.post('/logs', (req, res) => {
  let logs = readJSON(logPath);
  const logData = req.body;

  console.log('Received data:', logData); // Debug payload nhận được

  if (!logData.uid || !logData.status)
    return res.status(400).json({ error: 'UID and status are required' });

  // Lưu toàn bộ payload và thêm các trường time, day nếu cần
  const log = {
    ...logData,
    time: logData.time || new Date().toISOString(),
    day: logData.day || new Date().toISOString().slice(0, 10),
  };

  logs.push(log);
  writeJSON(logPath, logs);
  res.status(201).send('Log added');
});

// Start server
app.listen(port, () =>
  console.log(`✅ Server running at http://172.20.10.2:${port}`)
);
