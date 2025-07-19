import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { OrderBookApi, SupportedChainId } from '@cowprotocol/cow-sdk';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/api/arbitrage', async (req, res) => {
  try {
    const chainId = SupportedChainId.MAINNET;
    const api = new OrderBookApi({ chainId });

    // Buscar tokens pela API pública
    const response = await fetch('https://api.cow.fi/mainnet/api/v1/tokens');
    const tokensData = await response.json();
    const tokens = tokensData.tokens; // Array de tokens

    const results = [];

    for (const sellToken of tokens) {
      for (const buyToken of tokens) {
        if (sellToken.address === buyToken.address) continue;

        try {
          const sellAmount = '1000000000000000000'; // 1 token (ajuste se necessário)
          const quote = await api.getQuote({ sellToken: sellToken.address, buyToken: buyToken.address, sellAmount });
          const price = parseFloat(quote.buyAmount) / parseFloat(quote.sellAmount);
          const midPrice = await api.getNativePrice(sellToken.address, buyToken.address);
          const spread = ((midPrice - price) / midPrice) * 100;

          if (spread > 0.5) {
            results.push({
              sellToken: sellToken.symbol,
              buyToken: buyToken.symbol,
              spread: spread.toFixed(2),
              price: price.toFixed(6)
            });
          }
        } catch (error) {
          // Ignorar pares sem cotação possível
        }
      }
    }

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API de arbitragem rodando na porta ${port}`);
});
