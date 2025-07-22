// services/arbitrageMonitor.js

const axios = require('axios');
const chains = [
  'ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'bsc', 'gnosis', 'fantom'
];

const LI_FI_API = 'https://li.quest/v1';
const PROFIT_THRESHOLD = 1.0; // lucro mínimo em USD

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Obtem tokens de uma rede
async function getTokens(chain) {
  try {
    const res = await axios.get(`${LI_FI_API}/tokens?chain=${chain}`);
    return res.data.tokens.map(token => ({
      ...token,
      chain
    }));
  } catch (err) {
    console.error(`Erro ao buscar tokens para ${chain}:`, err.response?.data || err.message);
    return [];
  }
}

// Agrupa tokens por symbol que existem em mais de uma chain
async function getCommonTokensAcrossChains() {
  const tokenMap = {};

  for (const chain of chains) {
    const tokens = await getTokens(chain);
    for (const token of tokens) {
      if (!token.symbol || !token.address) continue;
      const key = token.symbol.toUpperCase();
      if (!tokenMap[key]) tokenMap[key] = [];
      tokenMap[key].push(token);
    }
    await delay(500); // prevenir rate limit
  }

  // Filtra apenas tokens que estão em mais de uma chain
  const commonTokens = Object.entries(tokenMap)
    .filter(([_, list]) => list.length > 1)
    .map(([symbol, list]) => ({ symbol, instances: list }));

  return commonTokens;
}

// Verifica oportunidade de arbitragem entre instâncias de um mesmo token
async function checkArbitrage(tokenGroup) {
  const { symbol, instances } = tokenGroup;
  for (let i = 0; i < instances.length; i++) {
    for (let j = i + 1; j < instances.length; j++) {
      const from = instances[i];
      const to = instances[j];

      try {
        const route = await axios.get(`${LI_FI_API}/quote`, {
          params: {
            fromChain: from.chain,
            toChain: to.chain,
            fromToken: from.address,
            toToken: to.address,
            fromAmount: "1000000" // 1 unidade com 6 decimals (USDC etc)
          }
        });

        const { toAmountUSD, fromAmountUSD, estimate } = route.data;
        const profit = parseFloat(toAmountUSD) - parseFloat(fromAmountUSD);

        if (profit >= PROFIT_THRESHOLD) {
          console.log(`[+] Arbitragem encontrada: ${symbol}`);
          console.log(`    ${from.chain} → ${to.chain}`);
          console.log(`    Lucro estimado: $${profit.toFixed(2)}`);
          console.log(`    Link: https://jumper.exchange/?fromChain=${from.chain}&toChain=${to.chain}&fromToken=${from.address}&toToken=${to.address}`);
        }
      } catch (err) {
        console.warn(`Erro ao verificar rota ${from.chain} → ${to.chain} (${symbol}):`, err.response?.data || err.message);
      }
      await delay(300); // evitar rate limit
    }
  }
}

async function monitorArbitrage() {
  console.log("🔍 Buscando tokens comuns entre chains...");
  const tokenGroups = await getCommonTokensAcrossChains();

  console.log(`🔗 ${tokenGroups.length} tokens encontrados em múltiplas redes.`);
  for (const group of tokenGroups) {
    await checkArbitrage(group);
  }
  console.log("✅ Monitoramento concluído.");
}

monitorArbitrage();
