const express = require('express');
const cors = require('cors');
const app = express();
const loginRoute = require('./routes/login');
const oportunidadesRoute = require('./routes/oportunidades');

app.use(cors());
app.use(express.json());

app.use('/api/login', loginRoute);
app.use('/api/oportunidades', oportunidadesRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
