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

// Oportunidades de arbitragem
app.get('/api/oportunidades', async (req, res) => {
  const baseValue = parseFloat(req.query.valor) || 1000; // Valor base em USD
  const gasFee = 10; // Taxa de gás fixa em USD (pode ser ajustada)
  const opportunities = [];

  // Lista de tokens para verificar oportunidades
  const tokens = [
    {
      symbol: 'WBTC',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
      cgId: 'wrapped-bitcoin'
    },
    {
      symbol: 'WETH',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
      cgId: 'ethereum'
    },
    {
      symbol: 'DAI',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      cgId: 'dai'
    },
    {
      symbol: 'USDT',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      cgId: 'tether'
    }
  ];

  // Obter preços de mercado via CoinGecko
  const cgPrices = {};
  for (const token of tokens) {
    try {
      const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids: token.cgId, vs_currencies: 'usd' }
      });
      cgPrices[token.symbol] = data[token.cgId].usd;
    } catch (e) {
      console.error(`Erro CoinGecko para ${token.symbol}:`, e.message);
    }
  }

  // Para cada token, buscar cotações e calcular oportunidades
  for (const token of tokens) {
    const price = cgPrices[token.symbol];
    if (!price) continue;

    // Quantidade de entrada = $1000 em valor do token
    const amountIn = (baseValue / price) * Math.pow(10, token.decimals);
    const toToken = '0xA0b86991C6218b36C1d19D4a2e9Eb0cE3606eB48'; // USDC

    const quotes = [];

    // Cotação 1inch
    const q1 = await get1inchQuote(token.address, toToken, amountIn);
    if (q1) quotes.push({ aggregator: '1inch', amountOut: parseInt(q1) });

    // Cotação ParaSwap
    const q2 = await getParaSwapQuote(token.address, toToken, amountIn, token.decimals, 6);
    if (q2) quotes.push({ aggregator: 'ParaSwap', amountOut: parseInt(q2) });

    // Cotação KyberSwap
    const q3 = await getKyberSwapQuote(token.address, toToken, amountIn);
    if (q3) quotes.push({ aggregator: 'KyberSwap', amountOut: parseInt(q3) });

    if (quotes.length === 0) continue;

    // Encontrar a melhor cotação
    const bestQuote = quotes.reduce((prev, curr) => (curr.amountOut > prev.amountOut ? curr : prev));
    const amountOutUSD = bestQuote.amountOut / 1e6; // Converter USDC para USD
    const profit = amountOutUSD - baseValue; // Lucro bruto
    const netProfit = profit - gasFee; // Lucro líquido após taxas

    if (netProfit > 0) {
      opportunities.push({
        chain: 'Ethereum',
        pair: `${token.symbol}/USDC`,
        origin: `${token.symbol} (${bestQuote.aggregator})`, // Origem do token e protocolo
        destination: 'USDC', // Destino do swap
        spread: ((amountOutUSD - baseValue) / baseValue * 100).toFixed(2), // Percentual de ganho
        profit: profit.toFixed(2), // Lucro bruto em USD
        gasFee: gasFee.toFixed(2), // Taxa de gás em USD
        netProfit: netProfit.toFixed(2), // Lucro líquido em USD
        swapLink: getLinkSwap(bestQuote.aggregator, token.address, toToken) // Link direto para o swap
      });
    }
  }

  return res.json({ sucesso: true, oportunidades: opportunities });
});

// Funções auxiliares para cotações
const get1inchQuote = async (fromToken, toToken, amount) => {
  try {
    const { data } = await axios.get('https://api.1inch.io/v5.0/1/quote', {
      params: {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amount.toString()
      }
    });
    return data.toTokenAmount;
  } catch (e) {
    console.error('Erro 1inch:', e.message);
    return null;
  }
};

const getParaSwapQuote = async (fromToken, toToken, amount, fromDecimals, toDecimals) => {
  try {
    const { data } = await axios.get('https://api.paraswap.io/prices', {
      params: {
        srcToken: fromToken,
        destToken: toToken,
        srcDecimals: fromDecimals,
        destDecimals: toDecimals,
        amount: amount.toString(),
        network: 1 // Ethereum
      }
    });
    return data.priceRoute.destAmount;
  } catch (e) {
    console.error('Erro ParaSwap:', e.message);
    return null;
  }
};

const getKyberSwapQuote = async (fromToken, toToken, amount) => {
  try {
    const { data } = await axios.post('https://aggregator-api.kyberswap.com/ethereum/api/v1/routes', {
      tokenIn: fromToken,
      tokenOut: toToken,
      amountIn: amount.toString()
    });
    return data.routeSummary.outputAmount;
  } catch (e) {
    console.error('Erro KyberSwap:', e.message);
    return null;
  }
};

const getLinkSwap = (aggregator, fromToken, toToken) => {
  if (aggregator === '1inch') {
    return `https://app.1inch.io/#/1/swap/${fromToken}/${toToken}`;
  } else if (aggregator === 'ParaSwap') {
    return `https://app.paraswap.io/#/swap?srcToken=${fromToken}&destToken=${toToken}&network=1`;
  } else if (aggregator === 'KyberSwap') {
    return `https://kyberswap.com/s ascendeds/swap/ethereum/${fromToken}/${toToken}`;
  }
  return '';
};

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
