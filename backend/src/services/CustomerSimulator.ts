import { ExchangeService } from './ExchangeService.js';
import { Outlet, DonutType, CustomerSale } from '../models/types.js';

// Customer behavior types
export enum CustomerType {
  FIRST_FIND = 'first_find',    // Buys from first outlet with stock
  PRICE_HUNTER = 'price_hunter'  // Searches all outlets for cheapest price
}

export interface SimulatedCustomer {
  customerId: string;
  type: CustomerType;
  shoppingList: string[];  // List of donut-type-ids they want
  visitedOutlets: string[];
  purchases: CustomerSale[];
}

export interface CustomerEvent {
  eventType: 'customer_arrived' | 'customer_visiting' | 'customer_purchased' | 'customer_left';
  customer: SimulatedCustomer;
  outlet?: Outlet;
  sale?: CustomerSale;
  message: string;
}

type EventCallback = (event: CustomerEvent) => void;

export class CustomerSimulator {
  private exchangeService: ExchangeService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private customerCounter = 0;
  private eventCallbacks: EventCallback[] = [];

  // Base price for donuts (before outlet margin)
  private readonly BASE_DONUT_PRICE = 2.0;

  constructor(exchangeService: ExchangeService) {
    this.exchangeService = exchangeService;
  }

  onCustomerEvent(callback: EventCallback): void {
    this.eventCallbacks.push(callback);
  }

  private emitEvent(event: CustomerEvent): void {
    for (const callback of this.eventCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in customer event callback:', error);
      }
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Customer simulator already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting customer simulator (1-10 customers/second)...');

    // Spawn customers every second
    this.intervalId = setInterval(async () => {
      if (!this.isRunning) return;

      const numCustomers = Math.floor(Math.random() * 10) + 1; // 1-10 customers

      for (let i = 0; i < numCustomers; i++) {
        // Spawn each customer with a small random delay within the second
        const delay = Math.random() * 900; // 0-900ms delay
        setTimeout(() => this.spawnCustomer(), delay);
      }
    }, 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Customer simulator stopped');
  }

  private async spawnCustomer(): Promise<void> {
    try {
      // Get available data
      const [outlets, donutTypes] = await Promise.all([
        this.exchangeService.getAllOutlets(),
        this.exchangeService.getAllDonutTypes()
      ]);

      const openOutlets = outlets.filter(o => o.isOpen);
      if (openOutlets.length === 0 || donutTypes.length === 0) {
        return; // No open outlets or no donut types available
      }

      // Create a customer
      const customer = this.createCustomer(donutTypes);

      this.emitEvent({
        eventType: 'customer_arrived',
        customer,
        message: `Customer ${customer.customerId} arrived wanting: ${customer.shoppingList.join(', ')}`
      });

      // Process customer based on type
      if (customer.type === CustomerType.FIRST_FIND) {
        await this.processFirstFindCustomer(customer, openOutlets);
      } else {
        await this.processPriceHunterCustomer(customer, openOutlets);
      }

      this.emitEvent({
        eventType: 'customer_left',
        customer,
        message: `Customer ${customer.customerId} left after ${customer.purchases.length} purchases`
      });

    } catch (error) {
      console.error('Error spawning customer:', error);
    }
  }

  private createCustomer(donutTypes: DonutType[]): SimulatedCustomer {
    this.customerCounter++;

    // Random customer type (50/50 split)
    const type = Math.random() < 0.5 ? CustomerType.FIRST_FIND : CustomerType.PRICE_HUNTER;

    // Random shopping list (1-3 items)
    const numItems = Math.floor(Math.random() * 3) + 1;
    const shoppingList: string[] = [];
    const shuffledTypes = [...donutTypes].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(numItems, shuffledTypes.length); i++) {
      shoppingList.push(shuffledTypes[i].donutTypeId);
    }

    return {
      customerId: `customer-${this.customerCounter}`,
      type,
      shoppingList,
      visitedOutlets: [],
      purchases: []
    };
  }

  private calculatePrice(outlet: Outlet): number {
    return this.BASE_DONUT_PRICE * (1 + outlet.marginPercent / 100);
  }

  private async processFirstFindCustomer(customer: SimulatedCustomer, outlets: Outlet[]): Promise<void> {
    // Shuffle outlets for random visiting order
    const shuffledOutlets = [...outlets].sort(() => Math.random() - 0.5);

    // For each item in shopping list
    for (const donutTypeId of customer.shoppingList) {
      let purchased = false;

      // Visit outlets in random order until we find one that's open
      for (const outlet of shuffledOutlets) {
        if (!outlet.isOpen) continue;

        customer.visitedOutlets.push(outlet.outletId);

        this.emitEvent({
          eventType: 'customer_visiting',
          customer,
          outlet,
          message: `Customer ${customer.customerId} visiting ${outlet.outletName}`
        });

        // Buy from this outlet (first one found)
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 donuts
        try {
          const sale = await this.exchangeService.sellToCustomer(
            outlet.outletId,
            donutTypeId,
            quantity
          );

          customer.purchases.push(sale);

          this.emitEvent({
            eventType: 'customer_purchased',
            customer,
            outlet,
            sale,
            message: `Customer ${customer.customerId} bought ${quantity} ${donutTypeId} from ${outlet.outletName} for $${sale.revenue.toFixed(2)}`
          });

          purchased = true;
          break; // Move to next item in shopping list
        } catch (error) {
          // Outlet couldn't fulfill, try next
          continue;
        }
      }

      if (!purchased) {
        // Couldn't find anywhere to buy this item
      }
    }
  }

  private async processPriceHunterCustomer(customer: SimulatedCustomer, outlets: Outlet[]): Promise<void> {
    // Price hunter checks all outlets first, then buys from cheapest
    const openOutlets = outlets.filter(o => o.isOpen);

    for (const donutTypeId of customer.shoppingList) {
      // Find cheapest outlet
      let cheapestOutlet: Outlet | null = null;
      let cheapestPrice = Infinity;

      for (const outlet of openOutlets) {
        customer.visitedOutlets.push(outlet.outletId);

        this.emitEvent({
          eventType: 'customer_visiting',
          customer,
          outlet,
          message: `Customer ${customer.customerId} (price hunter) checking prices at ${outlet.outletName}`
        });

        const price = this.calculatePrice(outlet);
        if (price < cheapestPrice) {
          cheapestPrice = price;
          cheapestOutlet = outlet;
        }
      }

      // Buy from cheapest outlet
      if (cheapestOutlet) {
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 donuts
        try {
          const sale = await this.exchangeService.sellToCustomer(
            cheapestOutlet.outletId,
            donutTypeId,
            quantity
          );

          customer.purchases.push(sale);

          this.emitEvent({
            eventType: 'customer_purchased',
            customer,
            outlet: cheapestOutlet,
            sale,
            message: `Customer ${customer.customerId} (price hunter) bought ${quantity} ${donutTypeId} from ${cheapestOutlet.outletName} (cheapest at $${cheapestPrice.toFixed(2)}/unit)`
          });
        } catch (error) {
          // Couldn't buy from this outlet
        }
      }
    }
  }

  getStats(): { isRunning: boolean; customersSpawned: number } {
    return {
      isRunning: this.isRunning,
      customersSpawned: this.customerCounter
    };
  }
}
