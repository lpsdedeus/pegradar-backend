import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Usuário fixo
const usuarios = [
  { email: 'lsdedeus@hotmail.com', senha: '564988' }
];

// Login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const u = usuarios.find(u => u.email===email && u.senha===senha);
  if (!u) return res.status(401).json({ sucesso:false, mensagem:'Login inválido' });
  res.json({ sucesso:true, token:'token_simulado' });
});

// Ping de saúde
app.get('/api/ping', (_, res) => res.send('Servidor OK'));

// Oportunidades de arbitragem “redeem assets”
app.get('/api/oportunidades', async (_, res) => {
  try {
    const opps = [];
    // 1) Oráculo USDC
    const oracle = await axios.get('https://api.redstone.finance/prices?symbol=USDC');
    const usdcPrice = oracle.data[0]?.value || 1.0;

    // 2) Curve Finance
    const curve = await axios.get('https://api.curve.fi/api/getPools/ethereum/factory-crypto');
    for (const pool of curve.data.data.poolData) {
      if (!pool.coins.some(c => c.symbol==='USDC')) continue;
      const [c0, c1] = pool.coins;
      const spread = ((c1.usdPrice - c0.usdPrice) / c0.usdPrice) * 100;
      if (Math.abs(spread) > 0.5) {
        opps.push({
          par: `${c0.symbol}/${c1.symbol}`,
          spread: spread.toFixed(2),
          apr: ((spread * 365/7)).toFixed(2),
          tempo: '7 dias'
        });
      }
    }

    // 3) KyberSwap
    const kyber = await axios.get('https://aggregator-api.kyberswap.com/ethereum/api/v1/pools');
    for (const p of kyber.data.data.pools) {
      if (p.token0.symbol!=='USDC' && p.token1.symbol!=='USDC') continue;
      const diff = Math.abs(p.token0PriceUSD - p.token1PriceUSD) / usdcPrice * 100;
      if (diff > 0.5) {
        opps.push({
          par: `${p.token0.symbol}/${p.token1.symbol}`,
          spread: diff.toFixed(2),
          apr: ((diff * 365/7)).toFixed(2),
          tempo: '7 dias'
        });
      }
    }

    res.json({ sucesso:true, oportunidades:opps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso:false, mensagem:'Erro ao buscar oportunidades' });
  }
});

app.listen(port, () => console.log(`Backend rodando na porta ${port}`));
