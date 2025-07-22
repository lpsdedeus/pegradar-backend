// services/arbitrageMonitor.js
import axios from 'axios';

// Lista de tokens relacionados a USD, ETH e BTC (incluindo variantes)
const trackedTokens = [
  'usdc', 'usdt', 'dai', 'lusd', 'tacusd', 'slvlusd', 'xusd', 'xusd-2', 'yusd', 'savusd',
  'eth', 'weth', 'steth', 'wsteth', 'wsteth-2', 'teth', 'ezeth', 'weeth',
  'btc', 'wbtc', 'cbeth', 'cbeth', 'taceth', 'tacbtc'
];

// Lógica principal de busca
async function monitorArbitrage() {
  console.clear();
  console.log(`⏱️  Buscando oportunidades de arbitragem... [${new Date().toLocaleTimeString()}]`);

  try {
    const chainsResponse = await axios.get('https://li.quest/v1/chains');
    const chains = chainsResponse.data;

    for (const source of chains) {
      for (const destination of chains) {
        if (source.id === destination.id) continue;

        for (const token of trackedTokens) {
          const url = `https://li.quest/v1/routes?fromChain=${source.id}&toChain=${destination.id}&fromToken=${token}&toToken=${token}&fromAmount=1000000000000000000`;

          try {
            const res = await axios.get(url);
            const routes = res.data.routes;

            if (routes && routes.length > 0) {
              const best = routes[0];

              const profit = (best.toAmountUSD - best.fromAmountUSD).toFixed(2);
              if (profit > 0.3) {
                console.log(`💰 Arbitragem encontrada!`);
                console.log(`De: ${best.fromToken.symbol} na ${source.name}`);
                console.log(`Para: ${best.toToken.symbol} na ${destination.name}`);
                console.log(`Lucro estimado: US$ ${profit}`);
                console.log(`Token FROM: ${best.fromToken.address}`);
                console.log(`Token TO: ${best.toToken.address}`);
                console.log('-----------------------------');
              }
            }
          } catch (innerErr) {
            // Silenciosamente ignora erros de tokens inválidos ou falta de liquidez
          }
        }
      }
    }

  } catch (err) {
    console.error('❌ Erro ao buscar dados da LI.FI:', err.message);
  }

  // Espera 30 segundos antes de repetir
  setTimeout(monitorArbitrage, 30000);
}

export default monitorArbitrage;
