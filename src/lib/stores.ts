import { writable, derived } from 'svelte/store';
import type { DonutType, Outlet, OrderBook, Transaction, FactoryStatus } from './types';
import { api } from './api';
import { websocket, type ErrorData } from './websocket';

// Selected donut type for order book filtering
export const selectedDonutType = writable<DonutType | null>(null);

// Data stores
export const outlets = writable<Outlet[]>([]);
export const donutTypes = writable<DonutType[]>([]);
export const orderBook = writable<OrderBook | null>(null);
export const transactions = writable<Transaction[]>([]);
export const factoryStatus = writable<FactoryStatus | null>(null);

// Loading states
export const loading = writable(false);
export const error = writable<string | null>(null);

// Error log (for displaying backend errors)
export const errorLog = writable<ErrorData[]>([]);

// Special "All Types" option for combined order book view
export const ALL_TYPES: DonutType = {
  donutTypeId: 'all',
  donutName: 'All Types',
  description: 'View all donut types'
};

// Initialize stores
export async function initializeStores() {
  loading.set(true);
  error.set(null);

  try {
    // Load outlets, donut types, and factory
    const [outletsData, donutTypesData, factoryStatusData] = await Promise.all([
      api.getOutlets(),
      api.getDonutTypes(),
      api.getFactory().catch(() => null) // Factory might not exist yet
    ]);

    outlets.set(outletsData);
    // Add "All Types" option at the beginning
    donutTypes.set([ALL_TYPES, ...donutTypesData]);
    factoryStatus.set(factoryStatusData);

    // Default to "All Types" view
    selectedDonutType.set(ALL_TYPES);

    // Connect WebSocket for real-time updates
    websocket.connect();

    // Subscribe to WebSocket events
    websocket.on('trade_executed', (message) => {
      const transaction = message.data as Transaction;
      transactions.update(txs => [transaction, ...txs].slice(0, 100));

      // Refresh order book if it's for the selected donut type
      selectedDonutType.subscribe(async (donutType) => {
        if (donutType && transaction.donutTypeId === donutType.donutTypeId) {
          await refreshOrderBook(donutType.donutTypeId);
        }
      })();

      // Refresh outlets to update balances
      refreshOutlets();
    });

    websocket.on('order_book_updated', (message) => {
      const book = message.data as OrderBook;
      selectedDonutType.subscribe(async (donutType) => {
        if (donutType) {
          // Refresh if viewing this specific type, or if viewing "all"
          if (book.donutTypeId === donutType.donutTypeId || donutType.donutTypeId === 'all') {
            await refreshOrderBook(donutType.donutTypeId);
          }
        }
      })();
    });

    websocket.on('error', (message) => {
      const errorData = message.data as ErrorData;
      errorLog.update(logs => [errorData, ...logs].slice(0, 100)); // Keep last 100 errors
    });

  } catch (err) {
    console.error('Failed to initialize stores:', err);

    // Provide helpful error messages
    let errorMessage = 'Failed to initialize';

    if (err instanceof TypeError && err.message.includes('fetch')) {
      errorMessage = 'Cannot connect to backend server. Please ensure the backend is running at http://localhost:3000';
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    error.set(errorMessage);
  } finally {
    loading.set(false);
  }
}

// Order book settings
export const showFilledOrders = writable(false);

// Refresh functions
export async function refreshOrderBook(donutTypeId: string, includeAll?: boolean) {
  try {
    // Use the passed value or get current setting
    let include = includeAll;
    if (include === undefined) {
      showFilledOrders.subscribe(v => include = v)();
    }
    const book = await api.getOrderBook(donutTypeId, include);
    orderBook.set(book);
  } catch (err) {
    console.error('Failed to refresh order book:', err);
  }
}

export async function refreshTransactions(donutTypeId?: string) {
  try {
    // Fetch all transactions if donutTypeId is not specified or is "all"
    const txs = (donutTypeId && donutTypeId !== 'all')
      ? await api.getTransactionsByDonutType(donutTypeId, 50)
      : await api.getTransactions(50);
    transactions.set(txs);
  } catch (err) {
    console.error('Failed to refresh transactions:', err);
  }
}

export async function refreshOutlets() {
  try {
    const outletsData = await api.getOutlets();
    outlets.set(outletsData);
  } catch (err) {
    console.error('Failed to refresh outlets:', err);
  }
}

export async function refreshFactory() {
  try {
    const status = await api.getFactory();
    factoryStatus.set(status);
  } catch (err) {
    console.error('Failed to refresh factory:', err);
  }
}

export async function toggleFactory(isOpen: boolean) {
  try {
    const result = await api.toggleFactory(isOpen);
    factoryStatus.set(result);
  } catch (err) {
    console.error('Failed to toggle factory:', err);
    throw err;
  }
}

export async function toggleOutlet(outletId: string, isOpen: boolean) {
  try {
    await api.toggleOutlet(outletId, isOpen);
    await refreshOutlets();
  } catch (err) {
    console.error('Failed to toggle outlet:', err);
    throw err;
  }
}

// Derived stores
export const bestBid = derived(orderBook, ($orderBook) => {
  if (!$orderBook || $orderBook.buyOrders.length === 0) return null;
  return $orderBook.buyOrders[0];
});

export const bestAsk = derived(orderBook, ($orderBook) => {
  if (!$orderBook || $orderBook.sellOrders.length === 0) return null;
  return $orderBook.sellOrders[0];
});

export const spread = derived([bestBid, bestAsk], ([$bestBid, $bestAsk]) => {
  if (!$bestBid || !$bestAsk) return null;
  return $bestAsk.pricePerUnit - $bestBid.pricePerUnit;
});

// Subscribe to selected donut type changes
selectedDonutType.subscribe((donutType) => {
  if (donutType) {
    refreshOrderBook(donutType.donutTypeId);
    refreshTransactions(donutType.donutTypeId);
  }
});
