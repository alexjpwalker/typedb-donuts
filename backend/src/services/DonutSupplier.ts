import { ExchangeService } from './ExchangeService.js';
import { OrderSide } from '../models/types.js';

/**
 * DonutSupplier acts as a virtual "factory" that periodically supplies
 * the exchange with donuts at varying prices.
 */
export class DonutSupplier {
  private exchangeService: ExchangeService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Supplier configuration
  private readonly SUPPLIER_ID = 'supplier-factory';
  private readonly BASE_PRICE = 2.00;
  private readonly PRICE_VARIANCE = 0.50; // +/- $0.50
  private readonly MIN_QUANTITY = 10;
  private readonly MAX_QUANTITY = 50;
  private readonly SUPPLY_INTERVAL_MS = 5000; // Every 5 seconds

  constructor(exchangeService: ExchangeService) {
    this.exchangeService = exchangeService;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Donut supplier already running');
      return;
    }

    // Ensure supplier outlet exists
    await this.ensureSupplierExists();

    this.isRunning = true;
    console.log('Starting donut supplier (factory)...');

    // Supply donuts periodically
    this.intervalId = setInterval(async () => {
      if (!this.isRunning) return;
      await this.supplyDonuts();
    }, this.SUPPLY_INTERVAL_MS);

    // Initial supply
    await this.supplyDonuts();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Donut supplier stopped');
  }

  private async ensureSupplierExists(): Promise<void> {
    try {
      const existing = await this.exchangeService.getOutlet(this.SUPPLIER_ID);
      if (!existing) {
        await this.exchangeService.createOutlet({
          outletId: this.SUPPLIER_ID,
          outletName: 'Donut Factory',
          location: 'Industrial District',
          balance: 1000000, // Unlimited funds essentially
          marginPercent: 0,
          isOpen: false // Factory doesn't sell to customers directly
        });
        console.log('Created supplier outlet: Donut Factory');
      }
    } catch (error) {
      console.error('Error ensuring supplier exists:', error);
    }
  }

  private async supplyDonuts(): Promise<void> {
    try {
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
            outletId: this.SUPPLIER_ID
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

  getStats(): { isRunning: boolean; supplierId: string } {
    return {
      isRunning: this.isRunning,
      supplierId: this.SUPPLIER_ID
    };
  }
}
