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

export interface Outlet {
  outletId: string;
  outletName: string;
  location: string;
  balance?: number; // Optional since some old outlets may not have it
  marginPercent?: number; // Retail markup percentage
  createdAt: string;
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
  buyerOutletId: string;
  sellerOutletId: string;
  buyOrderId: string;
  sellOrderId: string;
  executedAt: string;
}

export interface OrderBookEntry {
  orderId: string;
  outletId: string;
  quantity: number;
  pricePerUnit: number;
  createdAt: string;
}

export interface OrderBook {
  donutTypeId: string;
  buyOrders: OrderBookEntry[];
  sellOrders: OrderBookEntry[];
}
