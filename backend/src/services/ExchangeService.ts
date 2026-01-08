import { OrderRepository } from '../repositories/OrderRepository.js';
import { TransactionRepository } from '../repositories/TransactionRepository.js';
import { OutletRepository } from '../repositories/OutletRepository.js';
import { DonutTypeRepository } from '../repositories/DonutTypeRepository.js';
import { MatchingEngine } from '../engine/MatchingEngine.js';
import { CreateOrderRequest, Order, OrderBook, Transaction, Outlet, DonutType } from '../models/types.js';

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
}
