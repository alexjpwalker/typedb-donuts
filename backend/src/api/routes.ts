import express, { Request, Response, Router } from 'express';
import { ExchangeService } from '../services/ExchangeService.js';
import { CreateOrderRequest, OrderSide } from '../models/types.js';

export function createRoutes(exchangeService: ExchangeService): Router {
  const router = express.Router();

  // ==========================================
  // Health Check
  // ==========================================

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // Donut Types
  // ==========================================

  router.get('/donut-types', async (_req: Request, res: Response) => {
    try {
      const donutTypes = await exchangeService.getAllDonutTypes();
      res.json(donutTypes);
    } catch (error) {
      console.error('Error fetching donut types:', error);
      res.status(500).json({ error: 'Failed to fetch donut types' });
    }
  });

  router.get('/donut-types/:id', async (req: Request, res: Response) => {
    try {
      const donutType = await exchangeService.getDonutType(req.params.id);
      if (!donutType) {
        res.status(404).json({ error: 'Donut type not found' });
        return;
      }
      res.json(donutType);
    } catch (error) {
      console.error('Error fetching donut type:', error);
      res.status(500).json({ error: 'Failed to fetch donut type' });
    }
  });

  router.post('/donut-types', async (req: Request, res: Response) => {
    try {
      const donutType = await exchangeService.createDonutType(req.body);
      res.status(201).json(donutType);
    } catch (error) {
      console.error('Error creating donut type:', error);
      res.status(500).json({ error: 'Failed to create donut type' });
    }
  });

  // ==========================================
  // Outlets
  // ==========================================

  router.get('/outlets', async (_req: Request, res: Response) => {
    try {
      const outlets = await exchangeService.getAllOutlets();
      res.json(outlets);
    } catch (error) {
      console.error('Error fetching outlets:', error);
      res.status(500).json({ error: 'Failed to fetch outlets' });
    }
  });

  router.get('/outlets/:id', async (req: Request, res: Response) => {
    try {
      const outlet = await exchangeService.getOutlet(req.params.id);
      if (!outlet) {
        res.status(404).json({ error: 'Outlet not found' });
        return;
      }
      res.json(outlet);
    } catch (error) {
      console.error('Error fetching outlet:', error);
      res.status(500).json({ error: 'Failed to fetch outlet' });
    }
  });

  router.post('/outlets', async (req: Request, res: Response) => {
    try {
      const outlet = await exchangeService.createOutlet(req.body);
      res.status(201).json(outlet);
    } catch (error) {
      console.error('Error creating outlet:', error);
      res.status(500).json({ error: 'Failed to create outlet' });
    }
  });

  // ==========================================
  // Orders
  // ==========================================

  router.post('/orders', async (req: Request, res: Response) => {
    try {
      const orderRequest: CreateOrderRequest = req.body;

      // Validate request
      if (!orderRequest.side || !orderRequest.donutTypeId || !orderRequest.outletId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (orderRequest.quantity <= 0 || orderRequest.pricePerUnit <= 0) {
        res.status(400).json({ error: 'Quantity and price must be positive' });
        return;
      }

      if (![OrderSide.BUY, OrderSide.SELL].includes(orderRequest.side)) {
        res.status(400).json({ error: 'Invalid order side' });
        return;
      }

      const order = await exchangeService.createOrder(orderRequest);
      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: (error as Error).message || 'Failed to create order' });
    }
  });

  router.get('/orders/:id', async (req: Request, res: Response) => {
    try {
      const order = await exchangeService.getOrder(req.params.id);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  // ==========================================
  // Order Book
  // ==========================================

  router.get('/order-book/:donutTypeId', async (req: Request, res: Response) => {
    try {
      const orderBook = await exchangeService.getOrderBook(req.params.donutTypeId);
      res.json(orderBook);
    } catch (error) {
      console.error('Error fetching order book:', error);
      res.status(500).json({ error: 'Failed to fetch order book' });
    }
  });

  // ==========================================
  // Transactions
  // ==========================================

  router.get('/transactions', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const transactions = await exchangeService.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  router.get('/transactions/donut-type/:donutTypeId', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const transactions = await exchangeService.getTransactionsByDonutType(req.params.donutTypeId, limit);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  router.get('/transactions/:id', async (req: Request, res: Response) => {
    try {
      const transaction = await exchangeService.getTransaction(req.params.id);
      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }
      res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  });

  return router;
}
