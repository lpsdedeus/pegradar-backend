import axios from 'axios';

const LI_API = 'https://li.quest/v1/token';
const ROUTES_API = 'https://li.quest/v1/routes';

const stableKeywords = ['usd', 'usdc', 'usdt', 'xusd', 'savusd', 'tacusd', 'slvlusd', 'yusd'];
const ethKeywords = ['eth', 'weth', 'taceth', 'wsteth', 'ezeth', 'weeth'];
const btcKeywords = ['btc', 'cbeth', 'wbtc', 'tacbtc'];

const keywordMatch = (symbol, keywords) =>
  keywords.some((k) => symbol.toLowerCase().includes(k.toLowerCase()));

export async function monitorArbitrage() {
  const chains = ['ETH', 'POL', 'ARB', 'OP', 'BASE', 'AVAX', 'BSC', 'ZKSYNC'];
  const amount = '1000000000000000000'; // 1 ETH (em wei)

  for (const fromChain of chains) {
    for (const toChain of chains) {
      if (fromChain === toChain) continue;

      const tokenList = await axios.get(`${LI_API}?chain=${fromChain}`);
      const filtered = tokenList.data.tokens.filter((token) => {
        const symbol = token.symbol.toLowerCase();
        return (
          keywordMatch(symbol, stableKeywords) ||
          keywordMatch(symbol, ethKeywords) ||
          keywordMatch(symbol, btcKeywords)
        );
      });

      for (const token of filtered) {
        try {
          const routeUrl = `${ROUTES_API}?fromChain=${fromChain}&toChain=${toChain}&fromToken=${token.address}&toToken=${token.address}&fromAmount=${amount}&slippage=1`;
          const res = await axios.get(routeUrl);

          const route = res.data.routes?.[0];
          if (!route) continue;

          const output = parseFloat(route.toAmountUSD || 0);
          const input = parseFloat(route.fromAmountUSD || 0);

          const profit = output - input;
          const pctGain = (profit / input) * 100;

          if (pctGain > 0.3) {
            console.log('🚨 Arbitragem detectada:');
            console.log(`💰 Token: ${token.symbol}`);
            console.log(`🔄 Comprar em: ${fromChain}`);
            console.log(`💸
