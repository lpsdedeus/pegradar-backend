// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const loginRouter = require('./routes/login');             // assume login em routes/login.js
const oportunidadesRouter = require('./routes/oportunidades');

app.use(cors());
app.use(express.json());

// monta /api/login
app.use('/api/login', loginRouter);
// monta /api/oportunidades
app.use('/api/oportunidades', oportunidadesRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
