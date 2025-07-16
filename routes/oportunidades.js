const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const valorEmReais = parseFloat(req.query.valor || '1000');

    const response = await axios.get('https://yields.llama.fi/overview/ethereum');
    const oportunidades = [];

    for (const item of response.data.projects) {
      if (!item.symbol.includes('USDC')) continue; // apenas pares com USDC
      if (!item.apy || item.apy < 1) continue; // ignora APY abaixo de 1%

      const origem = item.project;
      const destino = item.symbol;
      const apr = (item.apy * 100).toFixed(2);
      const tempo = '7 dias';
      const spread = (item.apy * 7).toFixed(2); // simulação de spread de 7 dias

      const gasEstimado = 5.00; // valor fixo por enquanto (USD)
      const lucroBruto = (valorEmReais * (item.apy)).toFixed(2);
      const lucroLiquido = (lucroBruto - gasEstimado).toFixed(2);

      const linkSwap = `https://defillama.com/yield/${item.project.toLowerCase()}`;

      oportunidades.push({
        par: destino,
        origem,
        destino,
        apr,
        spread,
        tempo,
        gasEstimado,
        lucroLiquido,
        linkSwap
      });
    }

    res.json({ sucesso: true, oportunidades });
  } catch (erro) {
    console.error('Erro ao buscar dados da DefiLlama:', erro.message);
    res.json({ sucesso: false, mensagem: 'Erro ao buscar oportunidades' });
  }
});

module.exports = router;
