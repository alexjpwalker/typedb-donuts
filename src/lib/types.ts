// Frontend types matching backend models

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

export interface Factory {
  factoryId: string;
  factoryName: string;
  location: string;
  balance: number;
  isOpen: boolean; // Manual control: whether factory is enabled
  productionEnabled: boolean; // Auto-regulation: whether production is active
  createdAt: string;
}

export interface RetailOutlet {
  outletId: string;
  outletName: string;
  location: string;
  balance: number;
  marginPercent: number; // Retail markup percentage
  isOpen: boolean; // Whether outlet is open for business
  createdAt: string;
}

// Alias for backwards compatibility and general use
export type Outlet = RetailOutlet;

export interface FactoryStatus {
  factory: Factory;
  activeOrders: number;
  pauseThreshold: number;
  resumeThreshold: number;
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
  createdAt: string;
  updatedAt: string;
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
  buyerId: string;    // outlet-id of buyer (retail outlet)
  sellerId: string;   // factory-id or outlet-id of seller
  buyOrderId: string;
  sellOrderId: string;
  executedAt: string;
}

export interface OrderBookEntry {
  orderId: string;
  outletId: string;
  donutTypeId: string;
  quantity: number;
  pricePerUnit: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderBook {
  donutTypeId: string;
  buyOrders: OrderBookEntry[];
  sellOrders: OrderBookEntry[];
}
