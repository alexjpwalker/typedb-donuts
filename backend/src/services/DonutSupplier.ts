import { ExchangeService } from './ExchangeService.js';
import { OrderSide, Factory } from '../models/types.js';
import { FACTORY_PAUSE_THRESHOLD, FACTORY_RESUME_THRESHOLD } from '../config/constants.js';

/**
 * DonutSupplier acts as a virtual "factory" that periodically supplies
 * the exchange with donuts at varying prices.
 */
export class DonutSupplier {
  private exchangeService: ExchangeService;
  private timeoutId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isSupplying = false;
  private shouldStop = false;

  // Supplier configuration
  private readonly DEFAULT_FACTORY_ID = 'main-factory';
  private readonly BASE_PRICE = 2.00;
  private readonly PRICE_VARIANCE = 0.50; // +/- $0.50
  private readonly MIN_QUANTITY = 20;
  private readonly MAX_QUANTITY = 80;
  private readonly SUPPLY_INTERVAL_MS = 3000; // Every 3 seconds

  constructor(exchangeService: ExchangeService) {
    this.exchangeService = exchangeService;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Donut supplier already running');
      return;
    }

    // Ensure factory exists
    await this.ensureFactoryExists();

    this.isRunning = true;
    this.shouldStop = false;
    console.log('Starting donut supplier (factory)...');

    // Initial supply
    await this.supplyDonuts();

    // Schedule periodic supply
    this.scheduleSupply();
  }

  private scheduleSupply(): void {
    if (this.shouldStop) return;

    this.timeoutId = setTimeout(async () => {
      if (this.isSupplying || this.shouldStop) {
        this.scheduleSupply();
        return;
      }

      this.isSupplying = true;
      try {
        await this.supplyDonuts();
      } finally {
        this.isSupplying = false;
        this.scheduleSupply();
      }
    }, this.SUPPLY_INTERVAL_MS);
  }

  stop(): void {
    this.shouldStop = true;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isRunning = false;
    console.log('Donut supplier stopped');
  }

  private async ensureFactoryExists(): Promise<void> {
    try {
      const existing = await this.exchangeService.getFactory();
      if (!existing) {
        await this.exchangeService.createFactory({
          factoryId: this.DEFAULT_FACTORY_ID,
          factoryName: 'Donut Factory',
          location: 'Industrial District',
          balance: 1000000, // Unlimited funds essentially
          isOpen: true, // Manual control: factory starts enabled
          productionEnabled: true // Auto-regulation: production starts enabled
        });
        console.log('Created factory: Donut Factory');
      }
    } catch (error) {
      console.error('Error ensuring factory exists:', error);
    }
  }

  private async getFactory(): Promise<Factory | null> {
    try {
      return await this.exchangeService.getFactory();
    } catch {
      return null;
    }
  }

  private async countActiveFactoryOrders(): Promise<number> {
    try {
      const factory = await this.getFactory();
      if (!factory) return 0;

      const donutTypes = await this.exchangeService.getAllDonutTypes();
      let totalOrders = 0;
      for (const dt of donutTypes) {
        const orderBook = await this.exchangeService.getOrderBook(dt.donutTypeId, false);
        // Count sell orders from the factory
        totalOrders += orderBook.sellOrders.filter(o => o.outletId === factory.factoryId).length;
      }
      return totalOrders;
    } catch {
      return 0;
    }
  }

  private async autoRegulateFactory(): Promise<void> {
    const factory = await this.getFactory();
    if (!factory) return;

    // Only auto-regulate if factory is manually enabled (isOpen = true)
    if (!factory.isOpen) {
      return;
    }

    const activeOrders = await this.countActiveFactoryOrders();

    if (factory.productionEnabled && activeOrders >= FACTORY_PAUSE_THRESHOLD) {
      console.log(`🏭 Factory auto-pausing production: ${activeOrders} active orders (threshold: ${FACTORY_PAUSE_THRESHOLD})`);
      await this.exchangeService.setFactoryProductionEnabled(false);
    } else if (!factory.productionEnabled && activeOrders <= FACTORY_RESUME_THRESHOLD) {
      console.log(`🏭 Factory auto-resuming production: ${activeOrders} active orders (threshold: ${FACTORY_RESUME_THRESHOLD})`);
      await this.exchangeService.setFactoryProductionEnabled(true);
    }
  }

  private async supplyDonuts(): Promise<void> {
    try {
      // Auto-regulate factory based on order count
      await this.autoRegulateFactory();

      // Check if factory is enabled AND production is enabled
      const factory = await this.getFactory();
      if (!factory || !factory.isOpen || !factory.productionEnabled) {
        return;
      }

      const donutTypes = await this.exchangeService.getAllDonutTypes();
      if (donutTypes.length === 0) return;

      // Supply each donut type with some randomness
      for (const donutType of donutTypes) {
        // Random chance to supply this type (70%)
        if (Math.random() > 0.7) continue;

        const price = this.generatePrice();
        const quantity = this.generateQuantity();

        try {
          await this.exchangeService.createOrder({
            side: OrderSide.SELL,
            donutTypeId: donutType.donutTypeId,
            quantity,
            pricePerUnit: price,
            outletId: factory.factoryId
          });

          console.log(`🏭 Factory supplied ${quantity} ${donutType.donutTypeId} @ $${price.toFixed(2)}`);
        } catch (error) {
          // Order might fail if it immediately matches - that's fine
          console.log(`🏭 Factory supply matched immediately for ${donutType.donutTypeId}`);
        }
      }
    } catch (error) {
      console.error('Error supplying donuts:', error);
    }
  }

  private generatePrice(): number {
    // Base price +/- variance with some randomness
    const variance = (Math.random() * 2 - 1) * this.PRICE_VARIANCE;
    const price = this.BASE_PRICE + variance;
    // Round to 2 decimal places
    return Math.round(price * 100) / 100;
  }

  private generateQuantity(): number {
    return Math.floor(Math.random() * (this.MAX_QUANTITY - this.MIN_QUANTITY + 1)) + this.MIN_QUANTITY;
  }

  getStats(): { isRunning: boolean; factoryId: string } {
    return {
      isRunning: this.isRunning,
      factoryId: this.DEFAULT_FACTORY_ID
    };
  }
}
