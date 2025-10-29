import * as fs from 'fs';
import * as path from 'path';

interface StrategyData {
  id: string;
  magicNumber: number;
  name: string;
  symbol: string;
}

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

  // Parse Total trades / Transakcji Ogółem
  const totalTradesMatch = content.match(/Transakcji Ogółem[:\s]*<\/td>\s*<td[^>]*><b>\s*(\d+)<\/b>/i) ||
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

// Test with strategy #2
const htmlPath = '/Users/andrzej/Projects/_deus-quant-portfolio-site/data/backtest/html/2.html';
const metrics = parseHTMLReport(htmlPath);
console.log('Strategy #2 HTML Metrics:');
console.log(JSON.stringify(metrics, null, 2));
