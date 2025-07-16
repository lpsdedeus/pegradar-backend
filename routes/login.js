const express = require('express');
const router = express.Router();

// Login estático (para testes e acesso inicial)
const USUARIO_PADRAO = {
  email: 'lsdedeus@hotmail.com',
  senha: '564988',
};

router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (email === USUARIO_PADRAO.email && senha === USUARIO_PADRAO.senha) {
    return res.status(200).json({ sucesso: true, mensagem: `Bem-vindo ${email}` });
  } else {
    return res.status(401).json({ sucesso: false, mensagem: 'Login inválido' });
  }
});

module.exports = router;
