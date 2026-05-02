require('dotenv').config();

const express = require('express');
const cors = require('cors');
const webhookRoutes = require('./routes/webhook');
const apiRoutes = require('./routes/api');
const { initDatabase } = require('./services/database');

const app = express();

app.use(cors());

app.use('/webhook', webhookRoutes);

app.use(express.json());
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'GitGuard AI is running! 🛡️' });
});

const PORT = process.env.PORT || 3001;

initDatabase();

app.listen(PORT, () => {
  console.log(`🛡️  GitGuard AI server running on http://localhost:${PORT}`);
});