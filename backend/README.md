# Donut Exchange Backend

A TypeDB-powered order book exchange for donut outlets, built with Node.js, TypeScript, and Express.

## Features

- 📊 **Order Book Matching Engine** - Automatic matching of buy/sell orders at best prices
- 🍩 **Multi-Donut Support** - Trade different types of donuts
- 💰 **Real-time Balance Updates** - Automatic settlement on trade execution
- 🔌 **WebSocket Support** - Real-time market updates
- 🗄️ **TypeDB 3.x** - Graph database for complex relationships
- 🌐 **REST API** - Full CRUD operations for orders, outlets, and donut types

## Architecture

```
backend/
├── src/
│   ├── config/          # TypeDB connection (Cloud & Core support)
│   ├── schema/          # TypeDB schema definition (.tql)
│   ├── models/          # TypeScript interfaces/types
│   ├── repositories/    # Data access layer
│   ├── services/        # Business logic
│   ├── engine/          # Order book matching engine
│   ├── api/             # REST endpoints & WebSocket
│   └── server.ts        # Main entry point
```

## Prerequisites

- Node.js 18+
- TypeDB 3.x (Core or Cloud)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure TypeDB connection:**

   Copy `.env.example` to `.env` and configure:

   **For TypeDB Core (local):**
   ```env
   TYPEDB_CLOUD=false
   TYPEDB_ADDRESS=localhost:1729
   TYPEDB_DATABASE=donut-exchange
   ```

   **For TypeDB Cloud:**
   ```env
   TYPEDB_CLOUD=true
   TYPEDB_ADDRESS=your-instance.cloud.typedb.com:1729
   TYPEDB_USERNAME=your-username
   TYPEDB_PASSWORD=your-password
   TYPEDB_DATABASE=donut-exchange
   TYPEDB_TLS_ENABLED=true
   ```

3. **Set up the database schema:**
   ```bash
   npm run setup-schema
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## API Endpoints

### Health
- `GET /api/health` - Server health check

### Donut Types
- `GET /api/donut-types` - List all donut types
- `GET /api/donut-types/:id` - Get donut type by ID
- `POST /api/donut-types` - Create a new donut type

### Outlets
- `GET /api/outlets` - List all outlets
- `GET /api/outlets/:id` - Get outlet by ID
- `POST /api/outlets` - Create a new outlet

### Orders
- `POST /api/orders` - Place a new order (triggers matching)
- `GET /api/orders/:id` - Get order by ID
- `GET /api/order-book/:donutTypeId` - Get order book for a donut type

### Transactions
- `GET /api/transactions` - Get recent transactions
- `GET /api/transactions/donut-type/:donutTypeId` - Get transactions by donut type
- `GET /api/transactions/:id` - Get transaction by ID

## WebSocket

Connect to `ws://localhost:3000/ws` for real-time updates:

**Events:**
- `order_created` - New order placed
- `order_updated` - Order status/quantity changed
- `trade_executed` - Trade completed
- `order_book_updated` - Order book changed

## Example Usage

### 1. Create a donut type
```bash
curl -X POST http://localhost:3000/api/donut-types \
  -H "Content-Type: application/json" \
  -d '{
    "donutTypeId": "glazed",
    "donutName": "Glazed Donut",
    "description": "Classic glazed donut"
  }'
```

### 2. Create outlets
```bash
curl -X POST http://localhost:3000/api/outlets \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": "outlet-1",
    "outletName": "Downtown Donuts",
    "location": "123 Main St",
    "balance": 10000
  }'
```

### 3. Place orders
```bash
# Sell order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "side": "sell",
    "donutTypeId": "glazed",
    "quantity": 100,
    "pricePerUnit": 2.50,
    "outletId": "outlet-1"
  }'

# Buy order (will match if price >= sell price)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "side": "buy",
    "donutTypeId": "glazed",
    "quantity": 50,
    "pricePerUnit": 2.60,
    "outletId": "outlet-2"
  }'
```

### 4. View order book
```bash
curl http://localhost:3000/api/order-book/glazed
```

## Order Matching Logic

The exchange uses a **price-time priority** order book:

1. **Buy orders** sorted by price (highest first), then time
2. **Sell orders** sorted by price (lowest first), then time
3. When a new order arrives:
   - If it's a **buy order**, match against lowest-priced sell orders
   - If it's a **sell order**, match against highest-priced buy orders
4. Trades execute at the **maker's price** (existing order price)
5. Partial fills are supported - remaining quantity stays in the order book

## Development

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## TypeDB Schema

The schema models outlets, donut types, orders (buy/sell), and transactions with rich relationships:

- **Entities**: `outlet`, `donut-type`, `buy-order`, `sell-order`, `transaction`
- **Relations**: `listing-creation`, `order-placement`, `order-matching`, `trade-execution`

See `src/schema/schema.tql` for the complete schema definition.
