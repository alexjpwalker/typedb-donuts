import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { Order, Transaction, OrderBook } from '../models/types.js';

export interface WebSocketMessage {
  type: 'order_created' | 'order_updated' | 'trade_executed' | 'order_book_updated';
  data: Order | Transaction | OrderBook;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.clients = new Set();

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received WebSocket message:', data);
          // Handle incoming messages if needed (e.g., subscriptions)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Donut Exchange WebSocket'
      }));
    });
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(message: WebSocketMessage): void {
    const payload = JSON.stringify(message);

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
        }
      }
    });
  }

  /**
   * Notify clients when a new order is created
   */
  notifyOrderCreated(order: Order): void {
    this.broadcast({
      type: 'order_created',
      data: order
    });
  }

  /**
   * Notify clients when an order is updated
   */
  notifyOrderUpdated(order: Order): void {
    this.broadcast({
      type: 'order_updated',
      data: order
    });
  }

  /**
   * Notify clients when a trade is executed
   */
  notifyTradeExecuted(transaction: Transaction): void {
    this.broadcast({
      type: 'trade_executed',
      data: transaction
    });
  }

  /**
   * Notify clients when the order book changes
   */
  notifyOrderBookUpdated(orderBook: OrderBook): void {
    this.broadcast({
      type: 'order_book_updated',
      data: orderBook
    });
  }

  /**
   * Close all connections
   */
  close(): void {
    this.clients.forEach(client => {
      client.close();
    });
    this.wss.close();
    console.log('WebSocket server closed');
  }
}
