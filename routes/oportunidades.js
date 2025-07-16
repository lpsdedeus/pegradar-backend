const express = require('express');
const router = express.Router();

// Simulação de oportunidades reais de redeem assets
router.get('/oportunidades', (req, res) => {
  const oportunidades = [
    {
      par: 'CADC/USDC',
      origem: 'Redeem na Maple Finance',
      destino: 'Venda na Uniswap',
      apr: 1810.9,
      spread: 34.73,
      tempo: '7 dias',
      estimatedGasFeeUSD: 4.50
    },
    {
      par: 'LUSD/USDC',
      origem: 'Redeem na Liquity',
      destino: 'Venda na Curve',
      apr: 820.3,
      spread: 12.11,
      tempo: '5 dias',
      estimatedGasFeeUSD: 3.20
    }
  ];

  const oportunidadesComLucro = oportunidades.map((op) => {
    const lucroLiquido = ((op.spread / 100) * 1000) - op.estimatedGasFeeUSD;
    return {
      ...op,
      lucroLiquido: lucroLiquido.toFixed(2)
    };
  });

  res.json({ sucesso: true, oportunidades: oportunidadesComLucro });
});

module.exports = router;
