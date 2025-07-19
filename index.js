import express from 'express';
import cors from 'cors';
import { OrderBookApi, SupportedChainId } from '@cowprotocol/cow-sdk';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/api/arbitrage', async (req, res) => {
  try {
    const chainId = SupportedChainId.MAINNET;
    const api = new OrderBookApi({ chainId });

    // Obtém todos os tokens disponíveis
    const tokens = await api.getTokens();
    const tokenList = tokens.tokens;

    const results = [];

    for (const sellToken of Object.keys(tokenList)) {
      for (const buyToken of Object.keys(tokenList)) {
        if (sellToken === buyToken) continue;

        try {
          const sellAmount = '1000000000000000000'; // 1 token (ajuste se necessário)
          const quote = await api.getQuote({ sellToken, buyToken, sellAmount });
          const price = parseFloat(quote.buyAmount) / parseFloat(quote.sellAmount);
          const midPrice = await api.getNativePrice(sellToken, buyToken);
          const spread = ((midPrice - price) / midPrice) * 100;

          if (spread > 0.5) {
            results.push({ sellToken, buyToken, spread: spread.toFixed(2), price });
          }
        } catch (error) {
          // ignora erros de pares inválidos
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
