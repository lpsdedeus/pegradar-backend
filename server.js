// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Login fixo
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  if (email === 'lsdedeus@hotmail.com' && senha === '564988') {
    return res.json({ sucesso: true, mensagem: 'Bem-vindo!' });
  }
  return res.status(401).json({ sucesso: false, mensagem: 'Login inválido' });
});

// Oportunidades de Redeem Assets L1 + L2s via DefiLlama /pools
app.get('/api/oportunidades', async (req, res) => {
  try {
    const valor = parseFloat(req.query.valor) || 1000;
    const CHAINS = ['ethereum', 'arbitrum', 'polygon', 'base'];
    const oportunidades = [];

    // Para cada chain, buscar pools com APY
    await Promise.all(CHAINS.map(async (chain) => {
      try {
        const { data: pools } = await axios.get(
          `https://yields.llama.fi/pools?chain=${chain}`
        );
        pools.forEach(item => {
          // só pares envolvendo USDC
          if (!item.symbol.includes('USDC')) return;

          const par    = `${item.symbol}/USDC`;
          const origem = item.project;
          const destino= 'USDC';
          const apr    = (item.apy * 100).toFixed(2);
          const spread = (item.apy * 7 * 100).toFixed(2);
          const tempo  = '7 dias';
          const gas    = 5.0; // estimativa fixa
          const bruto  = valor * (item.apy || 0);
          const liquido= (bruto - gas).toFixed(2);
          const link   = `https://app.uniswap.org/#/swap?inputCurrency=${item.symbol}&outputCurrency=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&chain=${chain}`;

          oportunidades.push({
            chain,
            par,
            origem,
            destino,
            apr,
            spread,
            tempo,
            estimatedGasFeeUSD: gas,
            lucroLiquido: liquido,
            linkSwap: link
          });
        });
      } catch (e) {
        console.error(`Erro na chain ${chain}:`, e.message);
      }
    }));

    return res.json({ sucesso: true, oportunidades });
  } catch (err) {
    console.error('Erro na rota oportunidades:', err);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar oportunidades'
    });
  }
});

app.listen(PORT, () =>
  console.log(`Servidor rodando na porta ${PORT}`)
);
