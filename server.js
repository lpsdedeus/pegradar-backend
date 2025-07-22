const express = require('express');
const dotenv = require('dotenv');
const { runMonitor } = require('./service/arbitrageMonitor');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/status', (req, res) => {
  res.send('✅ PegRadar Monitor está ativo!');
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  runMonitor();
});
