import type {
  DonutType,
  Outlet,
  Order,
  OrderBook,
  Transaction,
  CreateOrderRequest
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);

      // Provide better error messages for network failures
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend at ${this.baseUrl}. Is the server running?`);
      }

      throw error;
    }
  }

  // Health
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }

  // Donut Types
  async getDonutTypes(): Promise<DonutType[]> {
    return this.request('/donut-types');
  }

  async getDonutType(id: string): Promise<DonutType> {
    return this.request(`/donut-types/${id}`);
  }

  async createDonutType(donutType: DonutType): Promise<DonutType> {
    return this.request('/donut-types', {
      method: 'POST',
      body: JSON.stringify(donutType),
    });
  }

  // Outlets
  async getOutlets(): Promise<Outlet[]> {
    return this.request('/outlets');
  }

  async getOutlet(id: string): Promise<Outlet> {
    return this.request(`/outlets/${id}`);
  }

  async createOutlet(outlet: Omit<Outlet, 'createdAt'>): Promise<Outlet> {
    return this.request('/outlets', {
      method: 'POST',
      body: JSON.stringify(outlet),
    });
  }

  // Orders
  async createOrder(order: CreateOrderRequest): Promise<Order> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async getOrder(id: string): Promise<Order> {
    return this.request(`/orders/${id}`);
  }

  // Order Book
  async getOrderBook(donutTypeId: string): Promise<OrderBook> {
    return this.request(`/order-book/${donutTypeId}`);
  }

  // Transactions
  async getTransactions(limit?: number): Promise<Transaction[]> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/transactions${query}`);
  }

  async getTransactionsByDonutType(donutTypeId: string, limit?: number): Promise<Transaction[]> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/transactions/donut-type/${donutTypeId}${query}`);
  }

  async getTransaction(id: string): Promise<Transaction> {
    return this.request(`/transactions/${id}`);
  }
}

export const api = new ApiClient(API_BASE_URL);
