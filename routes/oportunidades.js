const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const oportunidades = [
      {
        par: "CADC/USDC",
        origem: "Redeem no Maple Finance",
        destino: "Venda na Uniswap",
        apr: 1810.90,
        spread: 34.73,
        tempo: "7 dias",
        estimatedGasFeeUSD: 8.5,
        lucroLiquido: "322.73"
      },
      {
        par: "FIDU/USDC",
        origem: "Redeem na Goldfinch",
        destino: "Swap na Curve",
        apr: 17641.04,
        spread: 338.32,
        tempo: "7 dias",
        estimatedGasFeeUSD: 6.9,
        lucroLiquido: "310.20"
      },
      {
        par: "ibEUR/USDC",
        origem: "Redeem na Iron Bank",
        destino: "Venda na Balancer",
        apr: 1313661246.11,
        spread: 25193503.35,
        tempo: "7 dias",
        estimatedGasFeeUSD: 10.1,
        lucroLiquido: "500.00"
      }
    ];

    res.json({ sucesso: true, oportunidades });
  } catch (erro) {
    console.error("Erro ao buscar oportunidades:", erro.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar oportunidades" });
  }
});

module.exports = router;
