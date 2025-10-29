import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface MetricsComparison {
  magicNumber: number;
  name: string;
  htmlMetrics: any;
  webMetrics: any;
  discrepancies: string[];
  chartsOk: boolean;
}

function parseHTMLReport(htmlPath: string) {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  const metrics: any = {};

  // Parse key metrics from HTML report
  $('table').each((i, table) => {
    $(table).find('tr').each((j, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const key = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();

        // Map to our keys
        if (key === 'Total net profit') {
          metrics.totalNetProfit = parseFloat(value.replace(/[^0-9.-]/g, ''));
        } else if (key === 'Gross profit') {
          metrics.grossProfit = parseFloat(value.replace(/[^0-9.-]/g, ''));
        } else if (key === 'Gross loss') {
          metrics.grossLoss = parseFloat(value.replace(/[^0-9.-]/g, ''));
        } else if (key === 'Total trades') {
          metrics.totalTrades = parseInt(value);
        } else if (key === 'Profit trades (% of total)') {
          const match = value.match(/(\d+)\s*\(([0-9.]+)%\)/);
          if (match) {
            metrics.profitTrades = parseInt(match[1]);
            metrics.winRate = parseFloat(match[2]);
          }
        } else if (key === 'Loss trades (% of total)') {
          const match = value.match(/(\d+)/);
          if (match) {
            metrics.lossTrades = parseInt(match[1]);
          }
        } else if (key === 'Maximal drawdown') {
          // Format: "1234.56 (12.34%)"
          const match = value.match(/([0-9.]+)\s*\(([0-9.]+)%\)/);
          if (match) {
            metrics.maxDrawdownAbsolute = parseFloat(match[1]);
            metrics.maxDrawdownRelative = parseFloat(match[2]);
          }
        } else if (key === 'Average holding time') {
          metrics.avgHoldingTime = value;
        } else if (key === 'Minimal holding time') {
          metrics.minHoldingTime = value;
        } else if (key === 'Maximal holding time') {
          metrics.maxHoldingTime = value;
        }
      }
    });
  });

  return metrics;
}

function parseHoldingTime(timeStr: string): number {
  // Parse time like "1d 2:30:45" or "2:30:45" to hours
  const dayMatch = timeStr.match(/(\d+)d/);
  const days = dayMatch ? parseInt(dayMatch[1]) : 0;

  const timeMatch = timeStr.match(/(\d+):(\d+):(\d+)/);
  if (!timeMatch) return 0;

  const hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const seconds = parseInt(timeMatch[3]);

  return days * 24 + hours + minutes / 60 + seconds / 3600;
}

function compareValues(htmlVal: any, webVal: any, tolerance: number = 0.005): boolean {
  if (typeof htmlVal === 'number' && typeof webVal === 'number') {
    const diff = Math.abs(htmlVal - webVal);
    const maxVal = Math.max(Math.abs(htmlVal), Math.abs(webVal));
    return maxVal === 0 ? diff === 0 : diff / maxVal <= tolerance;
  }
  return htmlVal === webVal;
}

// Export for use in other scripts
export { parseHTMLReport, parseHoldingTime, compareValues };

console.log('Verification utilities ready');
