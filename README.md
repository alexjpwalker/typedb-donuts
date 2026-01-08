# 🍩 Donut Exchange

A real-time order book exchange for donut outlets, built with TypeDB 3.x, Node.js, TypeScript, and Svelte.

## Overview

The Donut Exchange is a global marketplace where donut outlets can trade donuts through an automated order book matching engine. Buy and sell orders are matched in real-time using price-time priority, with automatic settlement and balance updates.

## Features

- 🎯 **Order Book Matching** - Automatic price-time priority matching
- 💹 **Real-time Updates** - WebSocket integration for live market data
- 🍩 **Multi-Donut Trading** - Support for different donut types
- 💰 **Instant Settlement** - Automatic balance updates on trade execution
- 📊 **Transaction History** - Complete trade history tracking
- 🎨 **Modern UI** - Beautiful Svelte frontend with responsive design
- 🗄️ **TypeDB 3.x** - Graph database for complex relationship modeling

## Project Structure

```
typedb-hackathon-2026/
├── backend/                # Node.js/TypeScript backend
│   ├── src/
│   │   ├── config/        # TypeDB connection
│   │   ├── schema/        # TypeDB schema (.tql)
│   │   ├── models/        # TypeScript types
│   │   ├── repositories/  # Data access layer
│   │   ├── services/      # Business logic
│   │   ├── engine/        # Matching engine
│   │   ├── api/           # REST + WebSocket
│   │   └── server.ts      # Entry point
│   └── README.md
└── src/                    # Svelte frontend
    ├── lib/
    │   ├── components/    # UI components
    │   ├── api.ts         # API client
    │   ├── websocket.ts   # WebSocket client
    │   ├── stores.ts      # State management
    │   └── types.ts       # TypeScript types
    └── App.svelte         # Main component
```

## Prerequisites

- Node.js 18+
- TypeDB 3.x (Core or Cloud)

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure TypeDB

**For TypeDB Core (local):**

Edit `backend/.env`:
```env
TYPEDB_CLOUD=false
TYPEDB_ADDRESS=localhost:1729
TYPEDB_DATABASE=donut-exchange
```

**For TypeDB Cloud:**

Edit `backend/.env`:
```env
TYPEDB_CLOUD=true
TYPEDB_ADDRESS=your-instance.cloud.typedb.com:1729
TYPEDB_USERNAME=your-username
TYPEDB_PASSWORD=your-password
TYPEDB_DATABASE=donut-exchange
TYPEDB_TLS_ENABLED=true
```

### 3. Set Up Database Schema

```bash
cd backend
npm run setup-schema
```

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

Backend runs on http://localhost:3000

### 5. Start Frontend Dev Server

In a new terminal:

```bash
npm run dev
```

Frontend runs on http://localhost:5173

## Usage

### Initialize Data

Before trading, you need to create outlets and donut types. Use the API:

```bash
# Create a donut type
curl -X POST http://localhost:3000/api/donut-types \
  -H "Content-Type: application/json" \
  -d '{
    "donutTypeId": "glazed",
    "donutName": "Glazed Donut",
    "description": "Classic glazed donut"
  }'

# Create an outlet
curl -X POST http://localhost:3000/api/outlets \
  -H "Content-Type: application/json" \
  -d '{
    "outletId": "outlet-1",
    "outletName": "Downtown Donuts",
    "location": "123 Main St",
    "balance": 10000
  }'
```

### Trading

1. Open http://localhost:5173 in your browser
2. Select an outlet (your trading identity)
3. Select a donut type to trade
4. View the order book showing current bids and asks
5. Place buy or sell orders
6. Watch trades execute in real-time
7. View transaction history

## How It Works

### Order Book Matching

The exchange uses a **price-time priority** algorithm:

- **Buy orders** are sorted by price (highest first), then by time
- **Sell orders** are sorted by price (lowest first), then by time
- New orders are immediately matched against the best available opposite orders
- Trades execute at the **maker's price** (existing order price)
- Partial fills are supported - remaining quantity stays in the order book

### Example Trading Scenario

1. **Outlet A** places a sell order: 100 donuts @ $2.50
2. **Outlet B** places a buy order: 50 donuts @ $2.60
3. **Match occurs!** 50 donuts trade at $2.50 (seller's price)
4. Outlet A's sell order is partially filled (50 remaining @ $2.50)
5. Outlet B's buy order is fully filled
6. $125 transferred from Outlet B to Outlet A
7. Both outlets' balances update instantly

## API Endpoints

### Donut Types
- `GET /api/donut-types` - List all donut types
- `POST /api/donut-types` - Create donut type

### Outlets
- `GET /api/outlets` - List all outlets
- `POST /api/outlets` - Create outlet

### Orders
- `POST /api/orders` - Place order (triggers matching)
- `GET /api/orders/:id` - Get order details
- `GET /api/order-book/:donutTypeId` - Get order book

### Transactions
- `GET /api/transactions` - Get recent transactions
- `GET /api/transactions/donut-type/:donutTypeId` - Get transactions by donut type

### WebSocket
Connect to `ws://localhost:3000/ws` for real-time events:
- `order_created` - New order placed
- `order_updated` - Order status changed
- `trade_executed` - Trade completed
- `order_book_updated` - Order book updated

## Development

### Frontend
```bash
npm run dev    # Development server with HMR
npm run build  # Production build
```

### Backend
```bash
cd backend
npm run dev    # Development with hot reload
npm run build  # Compile TypeScript
npm start      # Run production build
```

## Tech Stack

### Backend
- **TypeDB 3.x** - Graph database
- **Node.js + TypeScript** - Runtime & language
- **Express** - HTTP server
- **ws** - WebSocket server
- **@typedb/driver-http** - TypeDB 3.x driver

### Frontend
- **Svelte 5** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server

## Architecture Highlights

- **Separation of Concerns** - Backend runs independently of frontend
- **Real-time Communication** - WebSocket for instant updates
- **Type Safety** - Full TypeScript coverage
- **Graph Database** - TypeDB models complex relationships naturally
- **Reactive UI** - Svelte stores for state management
- **Order Book Engine** - Efficient matching algorithm

## License

MIT
