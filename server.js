// server.js (na raiz do pegradar-backend)
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const loginRouter = require('./routes/login');
const oportunidadesRouter = require('./routes/oportunidades');

app.use(cors());
app.use(express.json());

// monta rota de login
app.use('/api/login', loginRouter);
// monta rota de oportunidades
app.use('/api/oportunidades', oportunidadesRouter);

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
