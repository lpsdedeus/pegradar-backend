const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  if (email === 'lsdedeus@hotmail.com' && senha === '564988') {
    return res.json({ sucesso: true, mensagem: 'Bem-vindo!' });
  }
  res.status(401).json({ sucesso: false, mensagem: 'Login inválido' });
});

const oportunidadesRouter = require('./routes/oportunidades');
app.use('/api/oportunidades', oportunidadesRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
