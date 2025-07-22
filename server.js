// server.js (na raiz)
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const runMonitor = require('./service/arbitrageMonitor');

app.get('/', (req, res) => {
  res.send('Monitor de arbitragem rodando...');
});

app.listen(port, () => {
  console.log(`Servidor escutando na porta ${port}`);
  // Inicia o monitor assim que o servidor subir
  runMonitor(); 
});
