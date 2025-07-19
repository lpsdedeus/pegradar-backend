const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { OrderBookApi, SupportedChainId } = require('@cowprotocol/cow-sdk');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;

app.get('/arbitrage', async (req, res) => {
  try {
    const api = new OrderBookApi({ chainId: SupportedChainId.MAINNET });
    // 1) busca de todos os tokens suportados pela CoW
    const tokensRes = await fetch('https://api.cow.fi/mainnet/api/v1/tokens');
    const tokens = await tokensRes.json();

    const results = [];
    // 2) gera todos os pares (sell → buy)
    for (let i = 0; i < tokens.length; i++) {
      for (let j = 0; j < tokens.length; j++) {
        if (i === j) continue;
        const sellToken = tokens[i].address;
        const buyToken  = tokens[j].address;
        const sellAmount = '1000000000000000000'; // 1 unidade

        try {
          const quote    = await api.getQuote({ sellToken, buyToken, sellAmount });
          const price    = parseFloat(quote.buyAmount) / parseFloat(quote.sellAmount);
          const midPrice = await api.getNativePrice(sellToken, buyToken);
          const spread   = ((midPrice - price) / midPrice) * 100;

          if (spread > 0.5) {
            results.push({
              sellToken,
              buyToken,
              spread: spread.toFixed(2),
              price: price.toFixed(6)
            });
          }
        } catch (err) {
          // ignora pares sem cotação possível
        }
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`API rodando: http://localhost:${PORT}`));
