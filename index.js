import dotenv from 'dotenv';
dotenv.config();

import { monitorArbitrage } from './services/arbitrageMonitor.js';

console.log('⏳ Iniciando monitor de arbitragem via LI.FI...');

setInterval(async () => {
  try {
    await monitorArbitrage();
  } catch (error) {
    console.error('Erro no monitoramento:', error.message);
  }
}, 30000); // Executa a cada 30 segundos
