// ==========================================
// Enums
// ==========================================

export enum OrderStatus {
  ACTIVE = 'active',
  PARTIALLY_FILLED = 'partially_filled',
  FILLED = 'filled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell'
}

// ==========================================
// Interfaces
// ==========================================

export interface Outlet {
  outletId: string;
  outletName: string;
  location: string;
  balance: number;
  marginPercent: number; // Retail markup percentage (e.g., 30 = 30%)
  isOpen: boolean; // Whether outlet is open for business
  productionEnabled?: boolean; // For factory only: whether auto-regulation allows production
  createdAt: Date;
}

export interface OutletStats {
  outletId: string;
  outletName: string;
  balance: number;
  customerSalesRevenue: number;
  customerSalesCount: number;
  exchangeSalesRevenue: number;
  exchangeSalesCount: number;
  netProfit: number;
  averageMargin: number;
}

export interface CustomerSale {
  saleId: string;
  outletId: string;
  donutTypeId: string;
  quantity: number;
  costBasis: number;
  revenue: number;
  profit: number;
  executedAt: Date;
}

export interface Inventory {
  outletId: string;
  donutTypeId: string;
  quantity: number;
  averageCost: number;
}

export interface DonutType {
  donutTypeId: string;
  donutName: string;
  description: string;
}

export interface Order {
  orderId: string;
  side: OrderSide;
  donutTypeId: string;
  quantity: number;
  pricePerUnit: number;
  status: OrderStatus;
  outletId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderRequest {
  side: OrderSide;
  donutTypeId: string;
  quantity: number;
  pricePerUnit: number;
  outletId: string;
}

export interface Transaction {
  transactionId: string;
  donutTypeId: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  buyerOutletId: string;
  sellerOutletId: string;
  buyOrderId: string;
  sellOrderId: string;
  executedAt: Date;
}

export interface OrderBookEntry {
  orderId: string;
  outletId: string;
  donutTypeId: string;
  quantity: number;
  pricePerUnit: number;
  status: OrderStatus;
  createdAt: Date;
}

export interface OrderBook {
  donutTypeId: string;
  buyOrders: OrderBookEntry[];  // Sorted by price desc (best bid first)
  sellOrders: OrderBookEntry[]; // Sorted by price asc (best ask first)
}

export interface MarketDepth {
  donutTypeId: string;
  bids: PriceLevel[];  // Buy orders grouped by price
  asks: PriceLevel[];  // Sell orders grouped by price
}

export interface PriceLevel {
  price: number;
  quantity: number;
  orderCount: number;
}

export interface TradeMatch {
  buyOrder: Order;
  sellOrder: Order;
  matchQuantity: number;
  matchPrice: number;
}

// ==========================================
// Purchasing Strategy
// ==========================================

/**
 * A single threshold tier in a purchasing strategy.
 * If current stock < targetStock and price <= maxPrice, buy to reach targetStock.
 */
export interface PurchasingThreshold {
  maxPrice: number;      // Maximum price willing to pay at this tier
  targetStock: number;   // Target stock level for this tier
}

/**
 * An outlet's purchasing strategy for a specific donut type.
 * Thresholds should be ordered from lowest maxPrice to highest (most aggressive first).
 */
export interface PurchasingStrategy {
  donutTypeId: string;
  thresholds: PurchasingThreshold[];  // Ordered by maxPrice ascending
}

/**
 * Complete purchasing configuration for an outlet.
 */
export interface OutletPurchasingConfig {
  outletId: string;
  strategies: PurchasingStrategy[];  // One per donut type
  enabled: boolean;                   // Whether auto-purchasing is enabled
}
