// services/arbitrageMonitor.js
import axios from 'axios';

// Lista base de tokens relacionados a USD, BTC, ETH e suas variantes
const tokenKeywords = ['usd', 'btc', 'eth', 'steth', 'weth', 'usdc', 'usdt', 'xusd', 'yusd', 'ezeth', 'weeth', 'savusd', 'tacusd', 'taceth', 'tacbtc', 'slvlusd', 'wsteth', 'wsteth-2'];

const chains = [
  'ethereum', 'arbitrum', 'polygon', 'optimism', 'base', 'avalanche',
  'bsc', 'gnosis', 'fantom', 'zksync', 'linea', 'scroll', 'mantle'
];

const LI_FI_API = 'https://li.quest/v1';

async function getTokenList(chain) {
  try {
    const res = await axios.get(`${LI_FI_API}/tokens?chain=${chain}`);
    return res.data.tokens || [];
  } catch (error) {
    console.error(`❌ Erro ao buscar tokens da chain ${chain}:`, error.message);
    return [];
  }
}

function isRelevantToken(token) {
  return token.symbol && tokenKeywords.some(keyword =>
    token.symbol.toLowerCase().includes(keyword)
  );
}

function generateTokenPairs(tokensA, tokensB) {
  const pairs = [];
  for (const tokenA of tokensA) {
    for (const tokenB of tokensB) {
      if (tokenA.symbol !== tokenB.symbol) {
        pairs.push({ fromToken: tokenA, toToken: tokenB });
      }
    }
  }
  return pairs;
}

async function checkArbitrageOpportunity(fromChain, toChain, fromToken, toToken) {
  try {
    const url = `${LI_FI_API}/quote?fromChain=${fromChain}&toChain=${toChain}&fromToken=${fromToken.address}&toToken=${toToken.address}&fromAmount=1000000000000000000`;
    const res = await axios.get(url);
    const result = res.data;

    const toAmount = Number(result.estimate?.toAmount || 0);
    const expectedAmount = 1e18;

    if (toAmount > expectedAmount * 1.01) {
      console.log(`💰 Arbitragem encontrada:\n🔄 Comprar ${fromToken.symbol} na ${fromChain} e vender ${toToken.symbol} na ${toChain}`);
      console.log(`📍 Contratos: ${fromToken.address} → ${toToken.address}`);
      console.log(`📈 Estimado: Recebe ${(toAmount / 1e18).toFixed(4)} ${toToken.symbol}\n`);
    }
  } catch (error) {
    if (error?.response?.status !== 400) {
      console.error(`⚠️ Erro no quote ${fromChain} → ${toChain}:`, error.message);
    }
  }
}

export default async function monitorArbitrage() {
  for (const fromChain of chains) {
    const fromTokens = (await getTokenList(fromChain)).filter(isRelevantToken);

    for (const toChain of chains) {
      if (fromChain === toChain) continue;

      const toTokens = (await getTokenList(toChain)).filter(isRelevantToken);

      const pairs = generateTokenPairs(fromTokens, toTokens).slice(0, 5); // Limita para testes

      for (const { fromToken, toToken } of pairs) {
        await checkArbitrageOpportunity(fromChain, toChain, fromToken, toToken);
      }
    }
  }

  console.log('✅ Monitoramento finalizado.\n');
}
