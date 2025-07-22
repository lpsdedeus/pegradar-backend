const axios = require('axios');

// Lista de tokens alvo
const trackedTokens = [
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { symbol: 'wBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
  { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' }, // ETH nativo
  { symbol: 'wstETH', address: '0x7f39c581f595b53c5cb19bb5ee0d8d93c6cb3f9c' },
  { symbol: 'cbETH', address: '0xbe9895146f7af43049ca1c1ae358b0541ea49704' },
  { symbol: 'XUSD', address: '0x247AAdE801A1cB3dF1aCbda1cF40451d3a45B7F1' } // Exemplo, confirme endereço real
];

// Configuração da API LI.FI
const API_URL = 'https://li.quest/v1/quote';
const chains = ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base', 'avalanche'];

async function checkArbitrage() {
  try {
    for (let i = 0; i < chains.length; i++) {
      for (let j = 0; j < chains.length; j++) {
        if (i === j) continue;

        const fromChain = chains[i];
        const toChain = chains[j];

        for (const token of trackedTokens) {
          const params = {
            fromChain,
            toChain,
            fromToken: token.address,
            toToken: token.address,
            fromAmount: '100000000', // 0.1 unidade com 6 ou 18 decimais dependendo do token
            slippage: 0.5
          };

          const url = `${API_URL}?${new URLSearchParams(params).toString()}`;
          const response = await axios.get(url);

          if (response.data.estimate && response.data.estimate.toAmountMin) {
            const fromAmount = parseFloat(params.fromAmount) / 1e6;
            const toAmount = parseFloat(response.data.estimate.toAmountMin) / 1e6;
            const profit = toAmount - fromAmount;

            if (profit > 0.5) {
              console.log(`🤑 Arbitragem encontrada: ${token.symbol} | ${fromChain.toUpperCase()} → ${toChain.toUpperCase()}`);
              console.log(`➡️ Lucro estimado: ${profit.toFixed(4)} ${token.symbol}`);
              console.log('---');
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Erro ao verificar arbitragem:', err.message);
  }
}

// Exporta função para ser usada no server.js
function runMonitor() {
  console.log('✅ Monitor de arbitragem iniciado...');
  checkArbitrage(); // Roda uma vez ao iniciar
  setInterval(checkArbitrage, 5 * 60 * 1000); // Roda a cada 5 minutos
}

module.exports = { runMonitor };
