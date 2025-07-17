const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Função para obter cotação da 1inch
async function get1inchQuote(fromToken, toToken, amount) {
  try {
    const url = `https://api.1inch.io/v5.0/1/quote?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}`;
    console.log('URL da requisição 1inch:', url);
    const response = await axios.get(url);
    console.log('Resposta completa da 1inch:', response.data);
    return response.data.toTokenAmount;
  } catch (error) {
    console.error('Erro ao buscar cotação na 1inch:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
    return null;
  }
}

// Rota para oportunidades de arbitragem
app.get('/api/oportunidades', async (req, res) => {
  const opportunities = [];
  const token = {
    symbol: 'WBTC',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    decimals: 8,
  };
  const toToken = '0xA0b86991C6218b36C1d19D4a2e9Eb0cE3606eB48'; // USDC
  const amountIn = '100000000'; // 1 WBTC (100,000,000 satoshis)

  try {
    console.log('Buscando cotação na 1inch...');
    const q1 = await get1inchQuote(token.address, toToken, amountIn);
    console.log('Resposta 1inch:', q1);
    if (q1) {
      opportunities.push({ aggregator: '1inch', amountOut: q1 });
    } else {
      console.log('Nenhuma cotação válida da 1inch');
    }
  } catch (error) {
    console.error('Erro ao processar 1inch:', error.message);
  }

  return res.json({ sucesso: true, oportunidades: opportunities });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
