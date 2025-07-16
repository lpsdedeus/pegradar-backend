const express = require('express');
const axios = require('axios');
const router = express.Router();

const CHAINS = ['ethereum','arbitrum','polygon','base'];

router.get('/', async (req, res) => {
  try {
    const valor = parseFloat(req.query.valor) || 1000;
    const allProjects = [];

    // Busca em todas as chains
    const responses = await Promise.all(
      CHAINS.map(chain =>
        axios.get(`https://yields.llama.fi/overview/${chain}`)
          .then(r => ({ chain, data: r.data.projects }))
          .catch(() => ({ chain, data: [] }))
      )
    );

    // Agrega todos os projetos
    for (const { chain, data } of responses) {
      data.forEach(item => {
        if (!item.symbol.includes('USDC') || !item.apy || item.apy < 0.01) return;

        const origem = item.project;
        const destino = item.symbol;
        const apr = (item.apy * 100).toFixed(2);
        const spread = (item.apy * 7 * 100).toFixed(2); 
        const tempo = '7 dias';
        const gasEstimado = 5.00; 
        const lucroBruto = valor * item.apy;
        const lucroLiquido = (lucroBruto - gasEstimado).toFixed(2);
        const linkSwap = `https://app.uniswap.org/#/swap?inputCurrency=${destino}&outputCurrency=USDC&chain=${chain}`;

        allProjects.push({
          chain,
          par: `${destino}/USDC`,
          origem,
          destino,
          apr,
          spread,
          tempo,
          estimatedGasFeeUSD: gasEstimado,
          lucroLiquido,
          linkSwap
        });
      });
    }

    res.json({ sucesso: true, oportunidades: allProjects });
  } catch (err) {
    console.error('Erro ao buscar oportunidades:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar oportunidades' });
  }
});

module.exports = router;
