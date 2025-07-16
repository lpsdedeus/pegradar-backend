// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1) Login fixo
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  if (email === 'lsdedeus@hotmail.com' && senha === '564988') {
    return res.json({ sucesso: true, mensagem: 'Bem-vindo!' });
  }
  return res.status(401).json({ sucesso: false, mensagem: 'Login inválido' });
});

// 2) Oportunidades reais via DefiLlama pools
app.get('/api/oportunidades', async (req, res) => {
  try {
    const valor = parseFloat(req.query.valor) || 1000;
    // Chains que queremos
    const CHAINS = ['ethereum', 'arbitrum', 'polygon', 'base'];

    // Puxa todos os pools de uma vez
    const { data: pools } = await axios.get('https://api.llama.fi/pools');

    // Filtra e mapeia
    const oportunidades = pools
      .filter(pool =>
        CHAINS.includes(pool.chain.toLowerCase()) &&
        pool.symbol.includes('USDC') &&
        typeof pool.apy === 'number'
      )
      .map(pool => {
        const par    = `${pool.symbol}/USDC`;
        const origem = pool.project;
        const destino= 'USDC';
        const apr    = (pool.apy * 100).toFixed(2);
        const spread = (pool.apy * 7 * 100).toFixed(2);
        const tempo  = '7 dias';
        const gas    = 5.0; // estimativa fixa (USD)
        const bruto  = valor * pool.apy;
        const liquido= (bruto - gas).toFixed(2);
        // Link genérico para Uniswap (vasculhar depois por URL específica)
        const link   = `https://app.uniswap.org/#/swap?inputCurrency=${encodeURIComponent(pool.symbol)}&outputCurrency=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&chain=${pool.chain.toLowerCase()}`;

        return {
          chain: pool.chain.toLowerCase(),
          par,
          origem,
          destino,
          apr,
          spread,
          tempo,
          estimatedGasFeeUSD: gas,
          lucroLiquido: liquido,
          linkSwap: link
        };
      });

    return res.json({ sucesso: true, oportunidades });
  } catch (err) {
    console.error('Erro em /api/oportunidades:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar oportunidades' });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
