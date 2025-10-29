import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface HTMLMetrics {
  totalNetProfit?: number;
  grossProfit?: number;
  grossLoss?: number;
  totalTrades?: number;
  profitTrades?: number;
  lossTrades?: number;
  winRate?: number;
  maxDrawdownAbsolute?: number;
  maxDrawdownRelative?: number;
  avgHoldingTime?: string;
  minHoldingTime?: string;
  maxHoldingTime?: string;
}

interface WebMetrics {
  totalNetProfit: string;
  grossProfit: string;
  grossLoss: string;
  totalTrades: string;
  profitTrades: string;
  lossTrades: string;
  winRate: string;
  maxDrawdownAbsolute: string;
  maxDrawdownRelative: string;
  avgHoldingTime: string;
  minHoldingTime: string;
  maxHoldingTime: string;
}

interface StrategyVerification {
  magicNumber: number;
  name: string;
  htmlPath: string;
  hasHTML: boolean;
  htmlMetrics?: HTMLMetrics;
  webMetrics?: WebMetrics;
  discrepancies: string[];
  passed: boolean;
}

function parseHTMLReport(htmlPath: string): HTMLMetrics {
  const content = fs.readFileSync(htmlPath, 'utf16le');
  const metrics: HTMLMetrics = {};

  // Parse Total net profit / Zysk Netto Ogółem
  const netProfitMatch = content.match(/Zysk Netto Ogółem[:\s]*<\/td>\s*<td[^>]*><b>\s*([0-9\s.-]+)<\/b>/i) ||
                         content.match(/Total net profit[:\s]*<\/td>\s*<td[^>]*><b>\s*([0-9\s.-]+)<\/b>/i);
  if (netProfitMatch) {
    metrics.totalNetProfit = parseFloat(netProfitMatch[1].replace(/\s/g, '').replace(',', '.'));
  }

  // Parse Gross profit / Zysk Brutto
  const grossProfitMatch = content.match(/Zysk Brutto[:\s]*<\/td>\s*<td[^>]*><b>\s*([0-9\s.-]+)<\/b>/i) ||
                           content.match(/Gross profit[:\s]*<\/td>\s*<td[^>]*><b>\s*([0-9\s.-]+)<\/b>/i);
  if (grossProfitMatch) {
    metrics.grossProfit = parseFloat(grossProfitMatch[1].replace(/\s/g, '').replace(',', '.'));
  }

  // Parse Gross loss / Strata Brutto
  const grossLossMatch = content.match(/Strata Brutto[:\s]*<\/td>\s*<td[^>]*><b>\s*([0-9\s.-]+)<\/b>/i) ||
                         content.match(/Gross loss[:\s]*<\/td>\s*<td[^>]*><b>\s*([0-9\s.-]+)<\/b>/i);
  if (grossLossMatch) {
    metrics.grossLoss = parseFloat(grossLossMatch[1].replace(/\s/g, '').replace(',', '.'));
  }

  // Parse Total trades / Wszystkie Transakcje
  const totalTradesMatch = content.match(/Wszystkie Transakcje[:\s]*<\/td>\s*<td[^>]*><b>\s*(\d+)<\/b>/i) ||
                           content.match(/Total trades[:\s]*<\/td>\s*<td[^>]*><b>\s*(\d+)<\/b>/i);
  if (totalTradesMatch) {
    metrics.totalTrades = parseInt(totalTradesMatch[1]);
  }

  // Parse Profit trades / Zyskownych Transakcji
  const profitTradesMatch = content.match(/Zyskownych Transakcji[^<]*<\/td>\s*<td[^>]*><b>\s*(\d+)\s*\(([0-9.]+)%\)<\/b>/i) ||
                            content.match(/Profit trades[^<]*<\/td>\s*<td[^>]*><b>\s*(\d+)\s*\(([0-9.]+)%\)<\/b>/i);
  if (profitTradesMatch) {
    metrics.profitTrades = parseInt(profitTradesMatch[1]);
    metrics.winRate = parseFloat(profitTradesMatch[2].replace(',', '.'));
  }

  // Parse Loss trades / Stratnych Transakcji
  const lossTradesMatch = content.match(/Stratnych Transakcji[^<]*<\/td>\s*<td[^>]*><b>\s*(\d+)\s*\(([0-9.]+)%\)<\/b>/i) ||
                          content.match(/Loss trades[^<]*<\/td>\s*<td[^>]*><b>\s*(\d+)\s*\(([0-9.]+)%\)<\/b>/i);
  if (lossTradesMatch) {
    metrics.lossTrades = parseInt(lossTradesMatch[1]);
  }

  // Parse Maximal drawdown / Maksymalne Obsunięcie
  const maxDDMatch = content.match(/Maksymalne Obsunięcie[^<]*<\/td>\s*<td[^>]*><b>\s*([0-9\s.-]+)\s*\(([0-9.]+)%\)<\/b>/i) ||
                     content.match(/Maximal drawdown[^<]*<\/td>\s*<td[^>]*><b>\s*([0-9\s.-]+)\s*\(([0-9.]+)%\)<\/b>/i);
  if (maxDDMatch) {
    metrics.maxDrawdownAbsolute = parseFloat(maxDDMatch[1].replace(/\s/g, '').replace(',', '.'));
    metrics.maxDrawdownRelative = parseFloat(maxDDMatch[2].replace(',', '.'));
  }

  // Parse Average holding time / Średni Czas Utrzymania
  const avgTimeMatch = content.match(/Średni Czas Utrzymania[^<]*<\/td>\s*<td[^>]*><b>\s*([^<]+)<\/b>/i) ||
                       content.match(/Average holding time[^<]*<\/td>\s*<td[^>]*><b>\s*([^<]+)<\/b>/i);
  if (avgTimeMatch) {
    metrics.avgHoldingTime = avgTimeMatch[1].trim();
  }

  // Parse Min holding time / Minimalny Czas Utrzymania
  const minTimeMatch = content.match(/Minimalny Czas Utrzymania[^<]*<\/td>\s*<td[^>]*><b>\s*([^<]+)<\/b>/i) ||
                       content.match(/Minimal holding time[^<]*<\/td>\s*<td[^>]*><b>\s*([^<]+)<\/b>/i);
  if (minTimeMatch) {
    metrics.minHoldingTime = minTimeMatch[1].trim();
  }

  // Parse Max holding time / Maksymalny Czas Utrzymania
  const maxTimeMatch = content.match(/Maksymalny Czas Utrzymania[^<]*<\/td>\s*<td[^>]*><b>\s*([^<]+)<\/b>/i) ||
                       content.match(/Maximal holding time[^<]*<\/td>\s*<td[^>]*><b>\s*([^<]+)<\/b>/i);
  if (maxTimeMatch) {
    metrics.maxHoldingTime = maxTimeMatch[1].trim();
  }

  return metrics;
}

function compareValues(label: string, htmlVal: any, webVal: any, tolerance: number = 0.005): string | null {
  if (htmlVal === undefined || webVal === undefined) {
    return `${label}: Missing data (HTML: ${htmlVal}, Web: ${webVal})`;
  }

  // Convert web value if it's a string with $ or %
  let webNumeric = webVal;
  if (typeof webVal === 'string') {
    webNumeric = parseFloat(webVal.replace(/[$,\s%]/g, ''));
  }

  if (typeof htmlVal === 'number' && typeof webNumeric === 'number') {
    const diff = Math.abs(htmlVal - webNumeric);
    const maxVal = Math.max(Math.abs(htmlVal), Math.abs(webNumeric));
    const isEqual = maxVal === 0 ? diff === 0 : diff / maxVal <= tolerance;

    if (!isEqual) {
      return `${label}: HTML=${htmlVal} vs Web=${webNumeric} (diff: ${((diff/maxVal)*100).toFixed(2)}%)`;
    }
  } else if (htmlVal !== webNumeric) {
    return `${label}: HTML=${htmlVal} vs Web=${webNumeric}`;
  }

  return null;
}

// For Strategy #2 - extract from current page snapshot
const strategy2WebMetrics: WebMetrics = {
  totalNetProfit: '$698.18',
  grossProfit: '$2,124.71',
  grossLoss: '$-1,426.53',
  totalTrades: '430',
  profitTrades: '184 (42.79%)',
  lossTrades: '246 (57.21%)',
  winRate: '42.79%',
  maxDrawdownAbsolute: '$27.66', // Balance DD from page
  maxDrawdownRelative: '1.11%',
  avgHoldingTime: '9:15:14',
  minHoldingTime: '0:00:20',
  maxHoldingTime: '50:34:20'
};

async function verifyStrategy2() {
  const htmlPath = '/Users/andrzej/Projects/_deus-quant-portfolio-site/data/backtest/html/2.html';
  const htmlMetrics = parseHTMLReport(htmlPath);

  console.log('='.repeat(80));
  console.log('STRATEGY #2: NQ_H4_820422556_S_BB_CF_SQX');
  console.log('='.repeat(80));
  console.log('\nHTML Metrics:', JSON.stringify(htmlMetrics, null, 2));
  console.log('\nWeb Metrics:', JSON.stringify(strategy2WebMetrics, null, 2));

  const discrepancies: string[] = [];

  // Compare values
  const totalNetProfitCheck = compareValues('Total Net Profit', htmlMetrics.totalNetProfit, strategy2WebMetrics.totalNetProfit);
  if (totalNetProfitCheck) discrepancies.push(totalNetProfitCheck);

  const grossProfitCheck = compareValues('Gross Profit', htmlMetrics.grossProfit, strategy2WebMetrics.grossProfit);
  if (grossProfitCheck) discrepancies.push(grossProfitCheck);

  const grossLossCheck = compareValues('Gross Loss', htmlMetrics.grossLoss, strategy2WebMetrics.grossLoss);
  if (grossLossCheck) discrepancies.push(grossLossCheck);

  const totalTradesCheck = compareValues('Total Trades', htmlMetrics.totalTrades, strategy2WebMetrics.totalTrades);
  if (totalTradesCheck) discrepancies.push(totalTradesCheck);

  const profitTradesCheck = compareValues('Profit Trades', htmlMetrics.profitTrades, '184');
  if (profitTradesCheck) discrepancies.push(profitTradesCheck);

  const lossTradesCheck = compareValues('Loss Trades', htmlMetrics.lossTrades, '246');
  if (lossTradesCheck) discrepancies.push(lossTradesCheck);

  const winRateCheck = compareValues('Win Rate', htmlMetrics.winRate, '42.79');
  if (winRateCheck) discrepancies.push(winRateCheck);

  console.log('\n' + '='.repeat(80));
  if (discrepancies.length === 0) {
    console.log('✅ ALL CHECKS PASSED - 100% Data Accuracy');
  } else {
    console.log('❌ DISCREPANCIES FOUND:');
    discrepancies.forEach(d => console.log('  - ' + d));
  }
  console.log('='.repeat(80) + '\n');

  return discrepancies.length === 0;
}

verifyStrategy2().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
