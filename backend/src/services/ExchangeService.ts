import { OrderRepository } from '../repositories/OrderRepository.js';
import { TransactionRepository } from '../repositories/TransactionRepository.js';
import { OutletRepository } from '../repositories/OutletRepository.js';
import { DonutTypeRepository } from '../repositories/DonutTypeRepository.js';
import { MatchingEngine } from '../engine/MatchingEngine.js';
import { CreateOrderRequest, Order, OrderBook, Transaction, Outlet, DonutType, OutletStats, CustomerSale } from '../models/types.js';

export class ExchangeService {
  private orderRepo: OrderRepository;
  private transactionRepo: TransactionRepository;
  private outletRepo: OutletRepository;
  private donutTypeRepo: DonutTypeRepository;
  private matchingEngine: MatchingEngine;

  constructor() {
    this.orderRepo = new OrderRepository();
    this.transactionRepo = new TransactionRepository();
    this.outletRepo = new OutletRepository();
    this.donutTypeRepo = new DonutTypeRepository();
    this.matchingEngine = new MatchingEngine();
  }

  async start(): Promise<void> {
    await this.matchingEngine.start();
  }

  async stop(): Promise<void> {
    await this.matchingEngine.stop();
  }

  // ==========================================
  // Order Management
  // ==========================================

  async createOrder(request: CreateOrderRequest): Promise<Order> {
    // Validate outlet exists
    const outlet = await this.outletRepo.findById(request.outletId);
    if (!outlet) {
      throw new Error(`Outlet not found: ${request.outletId}`);
    }

    // Validate donut type exists
    const donutType = await this.donutTypeRepo.findById(request.donutTypeId);
    if (!donutType) {
      throw new Error(`Donut type not found: ${request.donutTypeId}`);
    }

    // Create the order
    const order = await this.orderRepo.create(request);

    // Attempt to match the order
    await this.matchingEngine.processOrder(order);

    // Return the updated order
    return await this.orderRepo.findById(order.orderId) || order;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return await this.orderRepo.findById(orderId);
  }

  async getOrderBook(donutTypeId: string): Promise<OrderBook> {
    return await this.orderRepo.getOrderBook(donutTypeId);
  }

  // ==========================================
  // Transaction History
  // ==========================================

  async getTransactionsByDonutType(donutTypeId: string, limit?: number): Promise<Transaction[]> {
    return await this.transactionRepo.findByDonutType(donutTypeId, limit);
  }

  async getRecentTransactions(limit?: number): Promise<Transaction[]> {
    return await this.transactionRepo.findRecent(limit);
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    return await this.transactionRepo.findById(transactionId);
  }

  // ==========================================
  // Outlet Management
  // ==========================================

  async createOutlet(outlet: Omit<Outlet, 'createdAt'>): Promise<Outlet> {
    return await this.outletRepo.create(outlet);
  }

  async getOutlet(outletId: string): Promise<Outlet | null> {
    return await this.outletRepo.findById(outletId);
  }

  async getAllOutlets(): Promise<Outlet[]> {
    return await this.outletRepo.findAll();
  }

  // ==========================================
  // Donut Type Management
  // ==========================================

  async createDonutType(donutType: DonutType): Promise<DonutType> {
    return await this.donutTypeRepo.create(donutType);
  }

  async getDonutType(donutTypeId: string): Promise<DonutType | null> {
    return await this.donutTypeRepo.findById(donutTypeId);
  }

  async getAllDonutTypes(): Promise<DonutType[]> {
    return await this.donutTypeRepo.findAll();
  }

  // ==========================================
  // Retail Operations
  // ==========================================

  async updateOutletMargin(outletId: string, marginPercent: number): Promise<void> {
    await this.outletRepo.updateMargin(outletId, marginPercent);
  }

  async toggleOutletOpen(outletId: string, isOpen: boolean): Promise<void> {
    await this.outletRepo.toggleOpen(outletId, isOpen);
  }

  async toggleAllOutletsOpen(isOpen: boolean): Promise<void> {
    await this.outletRepo.toggleAllOpen(isOpen);
  }

  async sellToCustomer(outletId: string, donutTypeId: string, quantity: number): Promise<CustomerSale> {
    const outlet = await this.outletRepo.findById(outletId);
    if (!outlet) {
      throw new Error('Outlet not found');
    }

    // Simplified: assume outlet bought donuts at $2/unit on the exchange
    // In reality, we'd track actual inventory cost basis
    const costBasis = 2.0 * quantity;
    const revenue = costBasis * (1 + outlet.marginPercent / 100);
    const profit = revenue - costBasis;

    // Update outlet balance (they receive cash from customer)
    await this.outletRepo.updateBalance(outletId, outlet.balance + revenue);

    console.log(`🛒 Customer Sale: ${outlet.outletName} sold ${quantity} ${donutTypeId} donuts`);
    console.log(`   Cost: $${costBasis.toFixed(2)}, Revenue: $${revenue.toFixed(2)}, Profit: $${profit.toFixed(2)} (${outlet.marginPercent}% margin)`);

    // Return sale record (simplified - not persisting to DB for now)
    return {
      saleId: `sale-${Date.now()}`,
      outletId,
      donutTypeId,
      quantity,
      costBasis,
      revenue,
      profit,
      executedAt: new Date()
    };
  }

  async getOutletStats(outletId: string): Promise<OutletStats> {
    const outlet = await this.outletRepo.findById(outletId);
    if (!outlet) {
      throw new Error('Outlet not found');
    }

    // Simplified stats - in reality we'd query customer-sale-record entities
    // For now, calculate based on balance changes
    const profitEstimate = Math.max(0, outlet.balance - 10000);

    return {
      outletId: outlet.outletId,
      outletName: outlet.outletName,
      totalRevenue: outlet.balance,
      totalCosts: 10000,
      netProfit: profitEstimate,
      customerSalesCount: 0, // TODO: Track actual sales
      averageMargin: outlet.marginPercent
    };
  }

  async getLeaderboard(): Promise<OutletStats[]> {
    const outlets = await this.outletRepo.findAll();

    const stats = outlets.map(outlet => {
      const profitEstimate = outlet.balance - 10000;
      return {
        outletId: outlet.outletId,
        outletName: outlet.outletName,
        totalRevenue: outlet.balance,
        totalCosts: 10000,
        netProfit: profitEstimate,
        customerSalesCount: 0,
        averageMargin: outlet.marginPercent
      };
    });

    // Sort by profit descending
    return stats.sort((a, b) => b.netProfit - a.netProfit);
  }
}
