const express = require('express');
const runMonitor = require('./service/arbitrageMonitor');

const app = express();
const PORT = process.env.PORT || 3000;

// Rota simples só para satisfazer o Render
app.get('/status', (req, res) => {
  res.send('✅ PegRadar monitor rodando com sucesso!');
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🟢 WebService ativo na porta ${PORT}`);
  
  // Inicia o monitor de arbitragem no background
  runMonitor();
});
