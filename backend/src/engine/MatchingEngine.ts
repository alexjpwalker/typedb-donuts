import { OrderRepository } from '../repositories/OrderRepository.js';
import { TransactionRepository } from '../repositories/TransactionRepository.js';
import { OutletRepository } from '../repositories/OutletRepository.js';
import { Order, OrderSide, OrderStatus, TradeMatch } from '../models/types.js';

export interface TradeExecutedEvent {
  buyerOutletId: string;
  sellerOutletId: string;
  quantity: number;
  price: number;
  totalAmount: number;
}

type TradeCallback = (event: TradeExecutedEvent) => void;

export class MatchingEngine {
  private orderRepo: OrderRepository;
  private transactionRepo: TransactionRepository;
  private outletRepo: OutletRepository;
  private tradeCallbacks: TradeCallback[] = [];

  constructor() {
    this.orderRepo = new OrderRepository();
    this.transactionRepo = new TransactionRepository();
    this.outletRepo = new OutletRepository();
  }

  onTradeExecuted(callback: TradeCallback): void {
    this.tradeCallbacks.push(callback);
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
      if (!sellOrder || sellOrder.status !== OrderStatus.ACTIVE) {
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
      if (!buyOrder || buyOrder.status !== OrderStatus.ACTIVE) {
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

    // Update outlet balances
    const buyer = await this.outletRepo.findById(buyOrder.outletId);
    const seller = await this.outletRepo.findById(sellOrder.outletId);

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

  /**
   * Continuously monitor for matching opportunities (background process)
   */
  async start(): Promise<void> {
    console.log('Matching engine started');
    // In a real implementation, this could use a queue or event system
    // For now, matching happens synchronously when orders are placed
  }

  async stop(): Promise<void> {
    console.log('Matching engine stopped');
  }
}
