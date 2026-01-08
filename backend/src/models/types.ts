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
  createdAt: Date;
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
  quantity: number;
  pricePerUnit: number;
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
