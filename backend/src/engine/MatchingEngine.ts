import { OrderRepository } from '../repositories/OrderRepository.js';
import { TransactionRepository } from '../repositories/TransactionRepository.js';
import { OutletRepository } from '../repositories/OutletRepository.js';
import { Order, OrderSide, OrderStatus, TradeMatch } from '../models/types.js';

export interface TradeExecutedEvent {
  buyerOutletId: string;
  sellerOutletId: string;
  donutTypeId: string;
  quantity: number;
  price: number;
  totalAmount: number;
}

type TradeCallback = (event: TradeExecutedEvent) => void;
type ErrorCallback = (message: string, source: string) => void;

export class MatchingEngine {
  private orderRepo: OrderRepository;
  private transactionRepo: TransactionRepository;
  private outletRepo: OutletRepository;
  private tradeCallbacks: TradeCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];

  constructor() {
    this.orderRepo = new OrderRepository();
    this.transactionRepo = new TransactionRepository();
    this.outletRepo = new OutletRepository();
  }

  onTradeExecuted(callback: TradeCallback): void {
    this.tradeCallbacks.push(callback);
  }

  onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  private emitError(message: string, source: string): void {
    for (const callback of this.errorCallbacks) {
      try {
        callback(message, source);
      } catch (error) {
        console.error('Error in error callback:', error);
      }
    }
  }

  /**
   * Process a new order and attempt to match it with existing orders
   */
  async processOrder(order: Order): Promise<void> {
    console.log(`Processing ${order.side} order ${order.orderId} for ${order.quantity} donuts at $${order.pricePerUnit}`);

    if (order.side === OrderSide.BUY) {
      await this.matchBuyOrder(order);
    } else {
      await this.matchSellOrder(order);
    }
  }

  /**
   * Match a buy order against existing sell orders
   */
  private async matchBuyOrder(buyOrder: Order): Promise<void> {
    const orderBook = await this.orderRepo.getOrderBook(buyOrder.donutTypeId);
    let remainingQuantity = buyOrder.quantity;

    // Iterate through sell orders (sorted by lowest price first)
    for (const sellEntry of orderBook.sellOrders) {
      if (remainingQuantity <= 0) break;

      // Can only match if sell price <= buy price
      if (sellEntry.pricePerUnit > buyOrder.pricePerUnit) {
        break; // No more matches possible (sell orders are sorted by price asc)
      }

      // Fetch full sell order
      const sellOrder = await this.orderRepo.findById(sellEntry.orderId);
      if (!sellOrder || (sellOrder.status !== OrderStatus.ACTIVE && sellOrder.status !== OrderStatus.PARTIALLY_FILLED)) {
        continue;
      }

      // Calculate match quantity
      const matchQuantity = Math.min(remainingQuantity, sellOrder.quantity);
      const matchPrice = sellOrder.pricePerUnit; // Price taker (buyer) pays seller's price

      console.log(`Matching: Buy order ${buyOrder.orderId} with Sell order ${sellOrder.orderId} for ${matchQuantity} @ $${matchPrice}`);

      // Execute the trade
      await this.executeTrade(buyOrder, sellOrder, matchQuantity, matchPrice);

      remainingQuantity -= matchQuantity;

      // Update buy order
      if (remainingQuantity === 0) {
        await this.orderRepo.updateStatus(buyOrder.orderId, OrderStatus.FILLED);
        console.log(`Buy order ${buyOrder.orderId} fully filled`);
      } else {
        await this.orderRepo.updateQuantity(buyOrder.orderId, remainingQuantity);
        await this.orderRepo.updateStatus(buyOrder.orderId, OrderStatus.PARTIALLY_FILLED);
      }

      // Update sell order
      if (matchQuantity === sellOrder.quantity) {
        await this.orderRepo.updateStatus(sellOrder.orderId, OrderStatus.FILLED);
        console.log(`Sell order ${sellOrder.orderId} fully filled`);
      } else {
        await this.orderRepo.updateQuantity(sellOrder.orderId, sellOrder.quantity - matchQuantity);
        await this.orderRepo.updateStatus(sellOrder.orderId, OrderStatus.PARTIALLY_FILLED);
      }
    }

    if (remainingQuantity > 0) {
      console.log(`Buy order ${buyOrder.orderId} remains partially filled with ${remainingQuantity} remaining`);
    }
  }

  /**
   * Match a sell order against existing buy orders
   */
  private async matchSellOrder(sellOrder: Order): Promise<void> {
    const orderBook = await this.orderRepo.getOrderBook(sellOrder.donutTypeId);
    let remainingQuantity = sellOrder.quantity;

    // Iterate through buy orders (sorted by highest price first)
    for (const buyEntry of orderBook.buyOrders) {
      if (remainingQuantity <= 0) break;

      // Can only match if buy price >= sell price
      if (buyEntry.pricePerUnit < sellOrder.pricePerUnit) {
        break; // No more matches possible (buy orders are sorted by price desc)
      }

      // Fetch full buy order
      const buyOrder = await this.orderRepo.findById(buyEntry.orderId);
      if (!buyOrder || (buyOrder.status !== OrderStatus.ACTIVE && buyOrder.status !== OrderStatus.PARTIALLY_FILLED)) {
        continue;
      }

      // Calculate match quantity
      const matchQuantity = Math.min(remainingQuantity, buyOrder.quantity);
      const matchPrice = buyOrder.pricePerUnit; // Price taker (seller) receives buyer's price

      console.log(`Matching: Sell order ${sellOrder.orderId} with Buy order ${buyOrder.orderId} for ${matchQuantity} @ $${matchPrice}`);

      // Execute the trade
      await this.executeTrade(buyOrder, sellOrder, matchQuantity, matchPrice);

      remainingQuantity -= matchQuantity;

      // Update sell order
      if (remainingQuantity === 0) {
        await this.orderRepo.updateStatus(sellOrder.orderId, OrderStatus.FILLED);
        console.log(`Sell order ${sellOrder.orderId} fully filled`);
      } else {
        await this.orderRepo.updateQuantity(sellOrder.orderId, remainingQuantity);
        await this.orderRepo.updateStatus(sellOrder.orderId, OrderStatus.PARTIALLY_FILLED);
      }

      // Update buy order
      if (matchQuantity === buyOrder.quantity) {
        await this.orderRepo.updateStatus(buyOrder.orderId, OrderStatus.FILLED);
        console.log(`Buy order ${buyOrder.orderId} fully filled`);
      } else {
        await this.orderRepo.updateQuantity(buyOrder.orderId, buyOrder.quantity - matchQuantity);
        await this.orderRepo.updateStatus(buyOrder.orderId, OrderStatus.PARTIALLY_FILLED);
      }
    }

    if (remainingQuantity > 0) {
      console.log(`Sell order ${sellOrder.orderId} remains partially filled with ${remainingQuantity} remaining`);
    }
  }

  /**
   * Execute a trade between a buy and sell order
   */
  private async executeTrade(
    buyOrder: Order,
    sellOrder: Order,
    quantity: number,
    price: number
  ): Promise<void> {
    const totalAmount = quantity * price;

    console.log(`[Trade] Creating transaction for ${quantity} @ $${price}`);

    // Create transaction record
    const transaction = await this.transactionRepo.create({
      donutTypeId: buyOrder.donutTypeId,
      quantity,
      pricePerUnit: price,
      totalAmount,
      buyerOutletId: buyOrder.outletId,
      sellerOutletId: sellOrder.outletId,
      buyOrderId: buyOrder.orderId,
      sellOrderId: sellOrder.orderId
    });

    console.log(`[Trade] Transaction created: ${transaction.transactionId}`);

    // Update outlet balances
    const buyer = await this.outletRepo.findById(buyOrder.outletId);
    const seller = await this.outletRepo.findById(sellOrder.outletId);

    if (!buyer) {
      console.error(`[Trade] Buyer not found: ${buyOrder.outletId}`);
    }
    if (!seller) {
      console.error(`[Trade] Seller not found: ${sellOrder.outletId}`);
    }

    if (buyer && seller) {
      // Buyer pays, seller receives
      await this.outletRepo.updateBalance(buyer.outletId, buyer.balance - totalAmount);
      await this.outletRepo.updateBalance(seller.outletId, seller.balance + totalAmount);

      console.log(`Trade executed: ${transaction.transactionId} - ${quantity} donuts @ $${price} = $${totalAmount}`);
      console.log(`  Buyer ${buyer.outletName} balance: $${buyer.balance} -> $${buyer.balance - totalAmount}`);
      console.log(`  Seller ${seller.outletName} balance: $${seller.balance} -> $${seller.balance + totalAmount}`);

      // Emit trade event for stats tracking
      const event: TradeExecutedEvent = {
        buyerOutletId: buyOrder.outletId,
        sellerOutletId: sellOrder.outletId,
        donutTypeId: buyOrder.donutTypeId,
        quantity,
        price,
        totalAmount
      };
      for (const callback of this.tradeCallbacks) {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in trade callback:', error);
        }
      }
    }
  }

  private sweepTimeoutId: NodeJS.Timeout | null = null;
  private readonly SWEEP_INTERVAL_MS = 5000; // Sweep every 5 seconds
  private isSweeping = false;
  private shouldStop = false;

  /**
   * Continuously monitor for matching opportunities (background process)
   */
  async start(): Promise<void> {
    console.log('Matching engine started');
    this.shouldStop = false;

    // Start background sweep - schedules next sweep only after current completes
    this.scheduleSweep();
  }

  private scheduleSweep(): void {
    if (this.shouldStop) return;

    this.sweepTimeoutId = setTimeout(async () => {
      if (this.isSweeping || this.shouldStop) {
        this.scheduleSweep();
        return;
      }

      this.isSweeping = true;
      try {
        await this.sweepForMatches();
      } finally {
        this.isSweeping = false;
        this.scheduleSweep();
      }
    }, this.SWEEP_INTERVAL_MS);
  }

  async stop(): Promise<void> {
    this.shouldStop = true;
    if (this.sweepTimeoutId) {
      clearTimeout(this.sweepTimeoutId);
      this.sweepTimeoutId = null;
    }
    console.log('Matching engine stopped');
  }

  /**
   * Sweep through all donut types looking for matching opportunities
   */
  private async sweepForMatches(): Promise<void> {
    try {
      // Get all donut types and sweep each order book
      const donutTypes = ['glazed', 'chocolate', 'jelly']; // TODO: fetch dynamically

      for (const donutTypeId of donutTypes) {
        const orderBook = await this.orderRepo.getOrderBook(donutTypeId);

        // Check if there are crossing orders (buy price >= sell price)
        if (orderBook.sellOrders.length > 0 && orderBook.buyOrders.length > 0) {
          const bestSell = orderBook.sellOrders[0];
          const bestBuy = orderBook.buyOrders[0];

          if (bestBuy.pricePerUnit >= bestSell.pricePerUnit) {
            // Found crossing orders - try to match them
            const buyOrder = await this.orderRepo.findById(bestBuy.orderId);
            if (buyOrder && (buyOrder.status === OrderStatus.ACTIVE || buyOrder.status === OrderStatus.PARTIALLY_FILLED)) {
              console.log(`[Sweep] Found crossing orders for ${donutTypeId}, attempting match...`);
              await this.matchBuyOrder(buyOrder);
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Sweep] Error during sweep:', error);
      this.emitError(errorMessage, 'MatchingEngine.sweep');
    }
  }
}
