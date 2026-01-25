import { storage } from './storage';
import { getQuote } from './marketDataService';

export async function checkPriceAlerts(): Promise<void> {
  console.log('[Price Alert Checker] Starting check...');
  
  try {
    const activeAlerts = await storage.getActivePriceAlerts();
    
    if (activeAlerts.length === 0) {
      console.log('[Price Alert Checker] No active alerts to check');
      return;
    }
    
    console.log(`[Price Alert Checker] Checking ${activeAlerts.length} active alerts`);
    
    const alertsBySymbol = new Map<string, typeof activeAlerts>();
    for (const alert of activeAlerts) {
      const existing = alertsBySymbol.get(alert.symbol) || [];
      existing.push(alert);
      alertsBySymbol.set(alert.symbol, existing);
    }
    
    for (const [symbol, alerts] of alertsBySymbol) {
      try {
        const quote = await getQuote(symbol);
        
        if (!quote) {
          console.log(`[Price Alert Checker] Could not fetch quote for ${symbol}`);
          continue;
        }
        
        const currentPrice = quote.price;
        console.log(`[Price Alert Checker] ${symbol}: $${currentPrice.toFixed(2)}`);
        
        for (const alert of alerts) {
          const targetPrice = parseFloat(String(alert.targetPrice)) || 0;
          let triggered = false;
          
          if (alert.alertType === 'price_above' && currentPrice >= targetPrice) {
            triggered = true;
            console.log(`[Price Alert Checker] TRIGGERED: ${symbol} above $${targetPrice} (current: $${currentPrice.toFixed(2)})`);
          } else if (alert.alertType === 'price_below' && currentPrice <= targetPrice) {
            triggered = true;
            console.log(`[Price Alert Checker] TRIGGERED: ${symbol} below $${targetPrice} (current: $${currentPrice.toFixed(2)})`);
          }
          
          if (triggered) {
            await storage.triggerPriceAlert(alert.id, currentPrice);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[Price Alert Checker] Error checking ${symbol}:`, error);
      }
    }
    
    console.log('[Price Alert Checker] Check completed');
  } catch (error) {
    console.error('[Price Alert Checker] Error:', error);
  }
}

export function startPriceAlertChecker(intervalMs: number = 60 * 60 * 1000): NodeJS.Timeout {
  console.log(`[Price Alert Checker] Starting with ${intervalMs / 1000 / 60} minute interval`);
  
  setTimeout(() => checkPriceAlerts(), 5000);
  
  return setInterval(() => checkPriceAlerts(), intervalMs);
}
