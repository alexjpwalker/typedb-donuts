import { ExchangeService } from './ExchangeService.js';
import {
  OutletPurchasingConfig,
  PurchasingStrategy,
  PurchasingThreshold,
  OrderSide,
  Outlet
} from '../models/types.js';

/**
 * PurchasingAgent automatically executes purchasing strategies for outlets.
 * It monitors inventory levels and places buy orders when stock falls below thresholds.
 */
export class PurchasingAgent {
  private exchangeService: ExchangeService;
  private timeoutId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isExecuting = false;
  private shouldStop = false;

  // Store purchasing configs per outlet
  private configs: Map<string, OutletPurchasingConfig> = new Map();

  // How often to check and execute strategies
  private readonly CHECK_INTERVAL_MS = 3000; // Every 3 seconds

  constructor(exchangeService: ExchangeService) {
    this.exchangeService = exchangeService;
  }

  /**
   * Set the purchasing configuration for an outlet
   */
  setConfig(config: OutletPurchasingConfig): void {
    this.configs.set(config.outletId, config);
    console.log(`📋 Set purchasing config for ${config.outletId}: ${config.strategies.length} strategies, enabled=${config.enabled}`);
  }

  /**
   * Get the purchasing configuration for an outlet
   */
  getConfig(outletId: string): OutletPurchasingConfig | undefined {
    return this.configs.get(outletId);
  }

  /**
   * Initialize default strategies for all outlets
   */
  async initializeDefaultStrategies(): Promise<void> {
    const outlets = await this.exchangeService.getAllOutlets();
    const donutTypes = await this.exchangeService.getAllDonutTypes();

    for (const outlet of outlets) {
      // Skip the supplier factory
      if (outlet.outletId === 'supplier-factory') continue;

      // Create default strategies based on outlet's margin
      // Low margin outlets buy more aggressively (need volume)
      // High margin outlets can be pickier (rely on markup)
      const strategies = donutTypes.map(dt => this.createDefaultStrategy(dt.donutTypeId, outlet));

      this.setConfig({
        outletId: outlet.outletId,
        strategies,
        enabled: true
      });
    }
  }

  /**
   * Create a default purchasing strategy based on outlet characteristics
   */
  private createDefaultStrategy(donutTypeId: string, outlet: Outlet): PurchasingStrategy {
    // Base thresholds - adjust based on margin
    // Low margin (20%) = aggressive buying, high volume
    // High margin (50%) = selective buying, lower volume
    const marginFactor = outlet.marginPercent / 100;

    // Low margin outlets want more stock, high margin want less
    const baseStock = Math.round(30 - (marginFactor * 20)); // 30 for 0%, 10 for 50%

    return {
      donutTypeId,
      thresholds: [
        // Tier 1: Aggressive - buy cheap donuts up to high stock level
        { maxPrice: 1.60, targetStock: baseStock + 20 },
        // Tier 2: Normal - buy fair-priced donuts to maintain stock
        { maxPrice: 2.00, targetStock: baseStock + 10 },
        // Tier 3: Conservative - only buy expensive if running low
        { maxPrice: 2.40, targetStock: baseStock },
        // Tier 4: Emergency - buy at any price if nearly out
        { maxPrice: 3.00, targetStock: Math.max(5, baseStock - 10) }
      ]
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Purchasing agent already running');
      return;
    }

    this.isRunning = true;
    this.shouldStop = false;
    console.log('Starting purchasing agent...');

    // Initialize default strategies
    await this.initializeDefaultStrategies();

    // Schedule first execution
    this.scheduleExecution();
  }

  private scheduleExecution(): void {
    if (this.shouldStop) return;

    this.timeoutId = setTimeout(async () => {
      if (this.isExecuting || this.shouldStop) {
        this.scheduleExecution();
        return;
      }

      this.isExecuting = true;
      try {
        await this.executeAllStrategies();
      } finally {
        this.isExecuting = false;
        this.scheduleExecution();
      }
    }, this.CHECK_INTERVAL_MS);
  }

  stop(): void {
    this.shouldStop = true;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isRunning = false;
    console.log('Purchasing agent stopped');
  }

  /**
   * Execute purchasing strategies for all configured outlets
   */
  private async executeAllStrategies(): Promise<void> {
    for (const [outletId, config] of this.configs) {
      if (!config.enabled) continue;

      try {
        await this.executeOutletStrategies(outletId, config);
      } catch (error) {
        console.error(`Error executing strategies for ${outletId}:`, error);
      }
    }
  }

  /**
   * Execute all purchasing strategies for a single outlet
   */
  private async executeOutletStrategies(outletId: string, config: OutletPurchasingConfig): Promise<void> {
    const outlet = await this.exchangeService.getOutlet(outletId);
    if (!outlet || !outlet.isOpen) return; // Only buy if outlet is open

    for (const strategy of config.strategies) {
      await this.executeStrategy(outlet, strategy);
    }
  }

  /**
   * Execute a single purchasing strategy for an outlet
   */
  private async executeStrategy(outlet: Outlet, strategy: PurchasingStrategy): Promise<void> {
    const currentStock = this.exchangeService.getOutletInventory(outlet.outletId, strategy.donutTypeId);

    // Check each threshold tier (ordered by maxPrice ascending)
    for (const threshold of strategy.thresholds) {
      if (currentStock >= threshold.targetStock) {
        // We have enough stock for this tier, no need to buy
        continue;
      }

      // We need stock - check if there's supply at this price
      const orderBook = await this.exchangeService.getOrderBook(strategy.donutTypeId);

      // Find sell orders at or below our max price
      const affordableSupply = orderBook.sellOrders.filter(
        order => order.pricePerUnit <= threshold.maxPrice
      );

      if (affordableSupply.length === 0) {
        // No affordable supply at this tier, try next tier
        continue;
      }

      // Calculate how many we need to buy
      const neededQuantity = threshold.targetStock - currentStock;

      // Check if we can afford it
      const bestPrice = affordableSupply[0].pricePerUnit;
      const maxAffordable = Math.floor(outlet.balance / bestPrice);

      if (maxAffordable <= 0) {
        // Can't afford any
        continue;
      }

      // Buy the minimum of: what we need, what's available, what we can afford
      const availableQuantity = affordableSupply.reduce((sum, o) => sum + o.quantity, 0);
      const buyQuantity = Math.min(neededQuantity, availableQuantity, maxAffordable);

      if (buyQuantity <= 0) continue;

      // Place buy order at the threshold price (will match with cheaper orders first)
      try {
        await this.exchangeService.createOrder({
          side: OrderSide.BUY,
          donutTypeId: strategy.donutTypeId,
          quantity: buyQuantity,
          pricePerUnit: threshold.maxPrice, // Bid at max price, will match at best available
          outletId: outlet.outletId
        });

        console.log(`🛒 ${outlet.outletName} bought ${buyQuantity} ${strategy.donutTypeId} @ up to $${threshold.maxPrice.toFixed(2)} (stock was ${currentStock})`);

        // Don't continue to higher price tiers after placing an order
        break;
      } catch (error) {
        // Order might fail - that's ok, we'll try again next cycle
      }
    }
  }

  getStats(): { isRunning: boolean; configuredOutlets: number } {
    return {
      isRunning: this.isRunning,
      configuredOutlets: this.configs.size
    };
  }
}
