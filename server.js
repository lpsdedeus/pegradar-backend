const express = require('express');
const axios = require('axios');
const app = express();

app.get('/api/oportunidades', async (req, res) => {
  const opportunities = [];
  const token = {
    symbol: 'WBTC',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    decimals: 8,
  };
  const toToken = '0xA0b86991C6218b36C1d19D4a2e9Eb0cE3606eB48'; // USDC
  const amountIn = '100000000'; // 1 WBTC

  async function get1inchQuote(fromToken, toToken, amount) {
    try {
      const url = `https://api.1inch.io/v5.0/1/quote?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}`;
      const response = await axios.get(url);
      return response.data.toTokenAmount;
    } catch (error) {
      console.error('Erro na API 1inch:', error.message);
      return null;
    }
  }

  try {
    console.log('Buscando cotação na 1inch...');
    const q1 = await get1inchQuote(token.address, toToken, amountIn);
    console.log('Resposta 1inch:', q1);
    if (q1) {
      opportunities.push({ aggregator: '1inch', amountOut: q1 });
    }
  } catch (error) {
    console.error('Erro ao processar:', error.message);
  }

  return res.json({ sucesso: true, oportunidades: opportunities });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
