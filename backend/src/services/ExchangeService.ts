import { OrderRepository } from '../repositories/OrderRepository.js';
import { TransactionRepository } from '../repositories/TransactionRepository.js';
import { OutletRepository } from '../repositories/OutletRepository.js';
import { DonutTypeRepository } from '../repositories/DonutTypeRepository.js';
import { MatchingEngine } from '../engine/MatchingEngine.js';
import { CreateOrderRequest, Order, OrderBook, Transaction, Outlet, DonutType, OutletStats, CustomerSale } from '../models/types.js';

// In-memory tracking for sales statistics
interface OutletSalesStats {
  customerSalesRevenue: number;
  customerSalesCount: number;
  exchangeSalesRevenue: number;
  exchangeSalesCount: number;
}

// Inventory: outletId -> donutTypeId -> quantity
type InventoryMap = Map<string, Map<string, number>>;

export class ExchangeService {
  private orderRepo: OrderRepository;
  private transactionRepo: TransactionRepository;
  private outletRepo: OutletRepository;
  private donutTypeRepo: DonutTypeRepository;
  private matchingEngine: MatchingEngine;

  // Track sales stats per outlet (in-memory for now)
  private salesStats: Map<string, OutletSalesStats> = new Map();

  // Track inventory per outlet per donut type
  private inventory: InventoryMap = new Map();

  constructor() {
    this.orderRepo = new OrderRepository();
    this.transactionRepo = new TransactionRepository();
    this.outletRepo = new OutletRepository();
    this.donutTypeRepo = new DonutTypeRepository();
    this.matchingEngine = new MatchingEngine();
  }

  private getOrCreateStats(outletId: string): OutletSalesStats {
    if (!this.salesStats.has(outletId)) {
      this.salesStats.set(outletId, {
        customerSalesRevenue: 0,
        customerSalesCount: 0,
        exchangeSalesRevenue: 0,
        exchangeSalesCount: 0
      });
    }
    return this.salesStats.get(outletId)!;
  }

  private getInventory(outletId: string, donutTypeId: string): number {
    const outletInventory = this.inventory.get(outletId);
    if (!outletInventory) return 0;
    return outletInventory.get(donutTypeId) || 0;
  }

  private addInventory(outletId: string, donutTypeId: string, quantity: number): void {
    if (!this.inventory.has(outletId)) {
      this.inventory.set(outletId, new Map());
    }
    const outletInventory = this.inventory.get(outletId)!;
    const current = outletInventory.get(donutTypeId) || 0;
    outletInventory.set(donutTypeId, current + quantity);
  }

  private removeInventory(outletId: string, donutTypeId: string, quantity: number): boolean {
    const current = this.getInventory(outletId, donutTypeId);
    if (current < quantity) return false;
    const outletInventory = this.inventory.get(outletId)!;
    outletInventory.set(donutTypeId, current - quantity);
    return true;
  }

  async start(): Promise<void> {
    // Subscribe to trade events for stats and inventory tracking
    this.matchingEngine.onTradeExecuted((event) => {
      // Track exchange sale for the seller
      const sellerStats = this.getOrCreateStats(event.sellerOutletId);
      sellerStats.exchangeSalesRevenue += event.totalAmount;
      sellerStats.exchangeSalesCount += 1;

      // Add inventory to the buyer
      this.addInventory(event.buyerOutletId, event.donutTypeId, event.quantity);
      console.log(`📦 Inventory: ${event.buyerOutletId} received ${event.quantity} ${event.donutTypeId} donuts`);
    });

    await this.matchingEngine.start();
  }

  async stop(): Promise<void> {
    await this.matchingEngine.stop();
  }

  onMatchingError(callback: (message: string, source: string) => void): void {
    this.matchingEngine.onError(callback);
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

  async getOrderBook(donutTypeId: string, includeAll: boolean = false): Promise<OrderBook> {
    return await this.orderRepo.getOrderBook(donutTypeId, includeAll);
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
    const outlets = await this.outletRepo.findAll();
    // Filter out the supplier factory - it's internal infrastructure, not a retail outlet
    return outlets.filter(o => o.outletId !== 'supplier-factory');
  }

  async getFactory(): Promise<Outlet | null> {
    return await this.outletRepo.findById('supplier-factory');
  }

  async toggleFactoryOpen(isOpen: boolean): Promise<void> {
    await this.outletRepo.toggleOpen('supplier-factory', isOpen);
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

  getOutletInventory(outletId: string, donutTypeId: string): number {
    return this.getInventory(outletId, donutTypeId);
  }

  getAllOutletInventory(outletId: string): Map<string, number> {
    return this.inventory.get(outletId) || new Map();
  }

  async sellToCustomer(outletId: string, donutTypeId: string, quantity: number): Promise<CustomerSale> {
    const outlet = await this.outletRepo.findById(outletId);
    if (!outlet) {
      throw new Error('Outlet not found');
    }

    // Check inventory
    const available = this.getInventory(outletId, donutTypeId);
    if (available < quantity) {
      throw new Error(`Insufficient inventory: ${available} ${donutTypeId} available, ${quantity} requested`);
    }

    // Remove from inventory
    this.removeInventory(outletId, donutTypeId, quantity);

    // Simplified: assume outlet bought donuts at $2/unit on the exchange
    // In reality, we'd track actual inventory cost basis
    const costBasis = 2.0 * quantity;
    const revenue = costBasis * (1 + outlet.marginPercent / 100);
    const profit = revenue - costBasis;

    // Update outlet balance (they receive cash from customer)
    await this.outletRepo.updateBalance(outletId, outlet.balance + revenue);

    // Track customer sales stats
    const stats = this.getOrCreateStats(outletId);
    stats.customerSalesRevenue += revenue;
    stats.customerSalesCount += 1;

    console.log(`🛒 Customer Sale: ${outlet.outletName} sold ${quantity} ${donutTypeId} donuts (${available - quantity} remaining)`);
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

    const stats = this.getOrCreateStats(outletId);
    const netProfit = outlet.balance - 10000; // Starting balance was 10000

    return {
      outletId: outlet.outletId,
      outletName: outlet.outletName,
      balance: outlet.balance,
      customerSalesRevenue: stats.customerSalesRevenue,
      customerSalesCount: stats.customerSalesCount,
      exchangeSalesRevenue: stats.exchangeSalesRevenue,
      exchangeSalesCount: stats.exchangeSalesCount,
      netProfit,
      averageMargin: outlet.marginPercent
    };
  }

  async getLeaderboard(): Promise<OutletStats[]> {
    const outlets = await this.outletRepo.findAll();

    // Filter out the supplier factory - it's not a competing outlet
    const retailOutlets = outlets.filter(o => o.outletId !== 'supplier-factory');

    const leaderboard = retailOutlets.map(outlet => {
      const stats = this.getOrCreateStats(outlet.outletId);
      const netProfit = outlet.balance - 10000; // Starting balance was 10000
      return {
        outletId: outlet.outletId,
        outletName: outlet.outletName,
        balance: outlet.balance,
        customerSalesRevenue: stats.customerSalesRevenue,
        customerSalesCount: stats.customerSalesCount,
        exchangeSalesRevenue: stats.exchangeSalesRevenue,
        exchangeSalesCount: stats.exchangeSalesCount,
        netProfit,
        averageMargin: outlet.marginPercent
      };
    });

    // Sort by profit descending
    return leaderboard.sort((a, b) => b.netProfit - a.netProfit);
  }
}
