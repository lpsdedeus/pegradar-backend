// backend/arbitrageMonitor.js

const axios = require('axios'); const fs = require('fs');

const STABLE_KEYWORDS = ['usd', 'usdc', 'usdt', 'dai', 'xusd', 'yusd', 'savusd', 'slvlusd', 'tacusd']; const BTC_KEYWORDS = ['btc', 'cbeth', 'cbeth', 'cbbtc', 'tbcbtc', 'tacbtc']; const ETH_KEYWORDS = ['eth', 'taceth', 'ezeth', 'weeth', 'wsteth', 'teth'];

const CHECK_INTERVAL = 30 * 1000; // 30 segundos const MIN_PROFIT_THRESHOLD = 0.01; // 1% mínimo de lucro const LI_FI_API = 'https://li.quest/v1/routes';

async function fetchChains() { const res = await axios.get('https://li.quest/v1/chains'); return res.data.chains.map(c => c.id); }

function isRelevantToken(token) { const symbol = token.symbol?.toLowerCase() || ''; return STABLE_KEYWORDS.some(k => symbol.includes(k)) || BTC_KEYWORDS.some(k => symbol.includes(k)) || ETH_KEYWORDS.some(k => symbol.includes(k)); }

function formatOpportunity(route) { const from = route.fromToken; const to = route.toToken; return { buy_token: from.symbol, buy_chain: route.fromChain.name, buy_token_address: from.address, sell_token: to.symbol, sell_chain: route.toChain.name, sell_token_address: to.address, estimated_profit_pct: (((route.toAmountUSD - route.fromAmountUSD) / route.fromAmountUSD) * 100).toFixed(2) }; }

async function checkArbitrage() { try { const chains = await fetchChains(); const opportunities = [];

for (const fromChain of chains) {
  for (const toChain of chains) {
    if (fromChain === toChain) continue;

    const url = `${LI_FI_API}?fromChain=${fromChain}&toChain=${toChain}&fromAmount=1000000000000000000`;
    const { data } = await axios.get(url);

    if (!data.routes) continue;

    for (const route of data.routes) {
      const fromToken = route.fromToken;
      const toToken = route.toToken;

      if (isRelevantToken(fromToken) && isRelevantToken(toToken)) {
        const profitPct = (route.toAmountUSD - route.fromAmountUSD) / route.fromAmountUSD;
        if (profitPct >= MIN_PROFIT_THRESHOLD) {
          opportunities.push(formatOpportunity(route));
        }
      }
    }
  }
}

if (opportunities.length > 0) {
  const timestamp = new Date().toISOString();
  const log = { timestamp, opportunities };
  fs.writeFileSync('arbitrage-log.json', JSON.stringify(log, null, 2));
  console.log(`[${timestamp}] ⚡ ${opportunities.length} oportunidades encontradas!`);
} else {
  console.log(`[${new Date().toISOString()}] Sem oportunidades no momento.`);
}

} catch (error) { console.error('Erro ao buscar rotas:', error.message); } }

setInterval(checkArbitrage, CHECK_INTERVAL);

checkArbitrage();

