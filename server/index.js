const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { visits: 0, leaderboard: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/stats', (req, res) => {
  const data = readData();
  res.json({ visits: data.visits || 0, leaderboard: data.leaderboard || [] });
});

app.get('/visit', (req, res) => {
  // If API_KEY is set on the server, enforce a simple header-based auth to avoid abuse.
  const SERVER_API_KEY = process.env.API_KEY || '';
  if (SERVER_API_KEY) {
    const key = req.header('x-api-key') || '';
    if (key !== SERVER_API_KEY) return res.status(401).json({ error: 'invalid api key' });
  }
  const data = readData();
  data.visits = (data.visits || 0) + 1;
  writeData(data);
  res.json({ visits: data.visits });
});

app.get('/score', (req, res) => {
  const SERVER_API_KEY = process.env.API_KEY || '';
  if (SERVER_API_KEY) {
    const key = req.header('x-api-key') || '';
    if (key !== SERVER_API_KEY) return res.status(401).json({ error: 'invalid api key' });
  }
  const { name, timeMs } = req.body || {};
  if (typeof timeMs !== 'number') return res.status(400).json({ error: 'timeMs must be number' });
  const data = readData();
  data.leaderboard = data.leaderboard || [];
  data.leaderboard.push({ name: (name || 'Jogador'), timeMs: timeMs, at: new Date().toISOString() });
  data.leaderboard.sort((a,b) => a.timeMs - b.timeMs);
  data.leaderboard = data.leaderboard.slice(0, 10);
  writeData(data);
  res.json({ leaderboard: data.leaderboard });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`jogo-do-nunca server listening on ${port}`));
