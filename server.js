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
    return res.json({ sucesso: true, mensagem: 'Bem‑vindo!' });
  }
  return res.status(401).json({ sucesso: false, mensagem: 'Login inválido' });
});

// 2) Oportunidades reais: Curve, Kyber, DefiLlama Pools, WBTC/USDC
app.get('/api/oportunidades', async (req, res) => {
  const baseValue = parseFloat(req.query.valor) || 1000;
  const opps = [];

  // Helper para empurrar resultado
  const pushOpp = (o) => opps.push({
    ...o,
    lucroLiquido: (baseValue * (parseFloat(o.spread)/100) - o.estimatedGasFeeUSD).toFixed(2)
  });

  // 2.1) Curve Finance (factory-crypto pools, Ethereum L1)
  try {
    const { data } = await axios.get('https://api.curve.fi/api/getPools/ethereum/factory-crypto');
    for (const pool of data.data.poolData) {
      const usdcIdx = pool.coins.findIndex(c => c.symbol === 'USDC');
      if (usdcIdx < 0) continue;
      pool.coins.forEach((c, i) => {
        if (i === usdcIdx) return;
        const spread = ((c.usdPrice - pool.coins[usdcIdx].usdPrice) / pool.coins[usdcIdx].usdPrice * 100).toFixed(2);
        if (Math.abs(spread) < 0.5) return;
        pushOpp({
          chain: 'ethereum',
          par: `${c.symbol}/USDC`,
          origem: `Redeem ${c.symbol} (Curve)`,
          destino: 'USDC',
          apr: ((spread * 365)/7).toFixed(2),
          spread,
          tempo: '7 dias',
          estimatedGasFeeUSD: 5.0,
          linkSwap: `https://app.curve.fi/#/ethereum/factory-crypto/${pool.address}`
        });
      });
    }
  } catch (e) {
    console.error('Curve error:', e.message);
  }

  // 2.2) KyberSwap (Ethereum L1)
  try {
    const { data } = await axios.get('https://aggregator-api.kyberswap.com/ethereum/api/v1/pools');
    data.data.pools.forEach(p => {
      if (!p.token0.symbol.includes('USDC') && !p.token1.symbol.includes('USDC')) return;
      const symbol = p.token0.symbol === 'USDC' ? p.token1 : p.token0;
      const spread = (Math.abs(p.token0PriceUSD - p.token1PriceUSD)/1 * 100).toFixed(2);
      if (spread < 0.5) return;
      pushOpp({
        chain: 'ethereum',
        par: `${symbol.symbol}/USDC`,
        origem: `Redeem ${symbol.symbol} (Kyber)`,
        destino: 'USDC',
        apr: ((spread * 365)/7).toFixed(2),
        spread,
        tempo: '7 dias',
        estimatedGasFeeUSD: 5.0,
        linkSwap: `https://kyberswap.com/swap/${symbol.address}/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
      });
    });
  } catch (e) {
    console.error('Kyber error:', e.message);
  }

  // 2.3) DefiLlama Pools (Maple, Goldfinch, Iron Bank e outras)
  try {
    const { data: pools } = await axios.get('https://api.llama.fi/pools');
    pools.filter(p => 
      ['Maple Finance','Goldfinch','Iron Bank']
        .includes(p.project)
    ).forEach(p => {
      if (!p.symbol.includes('USDC') || typeof p.apy !== 'number') return;
      const spread = (p.apy * 100).toFixed(2);
      pushOpp({
        chain: p.chain.toLowerCase(),
        par: `${p.symbol}/USDC`,
        origem: `Redeem ${p.symbol} (${p.project})`,
        destino: 'USDC',
        apr: spread,
        spread,
        tempo: '7 dias',
        estimatedGasFeeUSD: 5.0,
        linkSwap: `https://defillama.com/yield/${encodeURIComponent(p.project.toLowerCase())}`
      });
    });
  } catch (e) {
    console.error('DefiLlama Pools error:', e.message);
  }

  // 2.4) WBTC/USDC (1inch quote vs CoinGecko)
  try {
    // Preço on‑chain via 1inch
    const q = await axios.get('https://api.1inch.io/v4.0/1/quote', {
      params: {
        fromTokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
        toTokenAddress:   '0xA0b86991C6218b36C1d19D4a2e9Eb0cE3606eB48', // USDC
        amount:           '100000000' // 1 WBTC = 1e8 satoshis
      }
    });
    const amt = q.data.toTokenAmount / 1e6; // USDC decimals
    // Preço via CoinGecko
    const cg = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids:'wrapped-bitcoin', vs_currencies:'usd' }
    });
    const vg = cg.data['wrapped-bitcoin'].usd;
    const spread = (((vg - amt) / amt) * 100).toFixed(2);
    if (Math.abs(spread) > 0.5) {
      pushOpp({
        chain: 'ethereum',
        par: 'WBTC/USDC',
        origem: 'Redeem WBTC (1inch)',
        destino: 'USDC',
        apr: ((spread * 365)/7).toFixed(2),
        spread,
        tempo: '7 dias',
        estimatedGasFeeUSD: 10.0,
        linkSwap: 'https://app.1inch.io/#/1/swap/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/0xa0b86991C6218b36c1d19d4a2e9Eb0cE3606eB48'
      });
    }
  } catch (e) {
    console.error('1inch WBTC error:', e.message);
  }

  // 2.5) Paraswap WETH/USDC (exemplo)
  try {
    const p = await axios.get('https://api.paraswap.io/prices', {
      params: {
        srcToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        destToken:'0xA0b86991C6218b36C1d19D4a2e9Eb0cE3606eB48', // USDC
        srcDecimals: 18,
        destDecimals: 6,
        amount: '1000000000000000000' // 1 WETH
      }
    });
    const price = p.data.destAmount / 1e6;
    const cgEth = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids:'ethereum', vs_currencies:'usd' }
    });
    const ethUsd = cgEth.data.ethereum.usd;
    const spread = (((ethUsd - price) / price)*100).toFixed(2);
    if (Math.abs(spread) > 0.5) {
      pushOpp({
        chain: 'ethereum',
        par: 'WETH/USDC',
        origem: 'Redeem WETH (ParaSwap)',
        destino: 'USDC',
        apr: ((spread * 365)/7).toFixed(2),
        spread,
        tempo: '7 dias',
        estimatedGasFeeUSD: 8.0,
        linkSwap: 'https://app.paraswap.io/#/1/swap'
      });
    }
  } catch (e) {
    console.error('ParaSwap WETH error:', e.message);
  }

  // Retorna tudo
  return res.json({ sucesso: true, oportunidades: opps });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
