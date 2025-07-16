const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const loginRoutes = require('./routes/login');
const oportunidadesRoutes = require('./routes/oportunidades');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', loginRoutes);
app.use('/api', oportunidadesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
