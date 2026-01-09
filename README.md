# TypeDB Donuts

A fully autonomous donut economy simulation powered by TypeDB 3.x. Watch a central factory supply donuts to retail outlets competing on High Street, all through a real-time exchange.

## Concept

**TypeDB Donuts** simulates a complete supply chain:

1. **The Factory** produces donuts and sells them on a central exchange
2. **Retail Outlets** buy donuts from the exchange and sell to customers
3. **Customers** visit outlets and purchase donuts at retail prices
4. **The Leaderboard** tracks which outlet makes the most profit

Everything runs autonomously - there's no manual trading. You simply watch the economy unfold and can tweak parameters like opening/closing outlets or the factory.

## The Simulation

### Factory (Donut Supplier)

The factory is the sole producer of donuts. It:
- Produces donuts every 3 seconds at prices around $2.00 (+/- $0.50)
- Places sell orders on the exchange for outlets to buy
- Has **auto-regulation**: pauses production when 20+ orders are waiting, resumes when orders drop to 10
- Can be manually opened/closed via the UI

### Retail Outlets

Each outlet operates as an independent business:
- Starts with $1,000 in capital
- Has a **retail margin** (20-50%) that determines markup when selling to customers
- Automatically buys inventory from the exchange using smart purchasing strategies
- Sells to customers at cost + margin (e.g., a $2.00 donut sells for $2.50 at 25% margin)

**Purchasing Strategy**: Outlets use tiered thresholds:
- Buy cheap donuts (< $1.60) aggressively to build stock
- Buy fair-priced donuts (< $2.00) to maintain stock
- Buy expensive donuts (< $2.40) only when running low
- Emergency buy (< $3.00) when nearly out of stock

Low-margin outlets (high volume, low profit per sale) buy more aggressively. High-margin outlets (selective, high profit per sale) are pickier.

### Simulated Customers

Virtual customers arrive every 2 seconds, each wanting 1-3 donuts:

- **First-Find Customers** (50%): Buy from the first outlet with stock
- **Price Hunters** (50%): Compare all outlets and buy from the cheapest

Customers can only buy from **open** outlets that have **inventory**.

### The Exchange

A price-time priority order book matching engine:
- Factory places **sell orders**
- Outlets place **buy orders**
- Orders match automatically at the best available price
- Settlement is instant: money and inventory transfer immediately

## Features

- **Fully Autonomous**: No manual intervention required - watch the economy run
- **Real-time Updates**: WebSocket integration for live market data
- **Performance Leaderboard**: Track which outlet strategy wins
- **Factory Auto-regulation**: Production responds to market demand
- **Outlet Controls**: Open/close individual outlets or all at once
- **Multi-Donut Types**: Trade different varieties (Glazed, Chocolate, etc.)
- **TypeDB 3.x**: Graph database for complex relationship modeling

## Project Structure

```
typedb-hackathon-2026/
├── backend/                 # Node.js/TypeScript backend
│   ├── src/
│   │   ├── config/         # TypeDB connection, constants
│   │   ├── schema/         # TypeDB schema
│   │   ├── models/         # TypeScript types
│   │   ├── repositories/   # Data access layer
│   │   ├── services/       # Business logic
│   │   │   ├── ExchangeService.ts    # Core exchange operations
│   │   │   ├── DonutSupplier.ts      # Factory production
│   │   │   ├── PurchasingAgent.ts    # Outlet buying strategies
│   │   │   └── CustomerSimulator.ts  # Customer simulation
│   │   ├── engine/         # Order matching engine
│   │   └── api/            # REST + WebSocket
│   └── package.json
└── src/                     # Svelte frontend
    ├── lib/
    │   ├── components/     # UI components
    │   ├── stores.ts       # State management
    │   └── types.ts        # TypeScript types
    └── App.svelte
```

## Prerequisites

- Node.js 18+
- TypeDB 3.x running locally or in the cloud

## Quick Start

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend && npm install
```

### 2. Configure TypeDB

Edit `backend/.env`:

```env
# For local TypeDB Core
TYPEDB_CLOUD=false
TYPEDB_ADDRESS=localhost:1729
TYPEDB_DATABASE=donut-exchange

# For TypeDB Cloud (uncomment and fill in)
# TYPEDB_CLOUD=true
# TYPEDB_ADDRESS=your-instance.cloud.typedb.com:1729
# TYPEDB_USERNAME=your-username
# TYPEDB_PASSWORD=your-password
# TYPEDB_TLS_ENABLED=true
```

### 3. Initialize Database

```bash
cd backend
npm run setup-schema
npm run init-data
```

### 4. Start Services

Terminal 1 - Backend:
```bash
cd backend && npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

Open http://localhost:5173 to watch the simulation.

## UI Overview

### Factory Control
Shows factory status with two states:
- **OPEN/CLOSED**: Manual control - is the factory enabled?
- **PRODUCING/PAUSED**: Auto-regulation - is production active?

Displays active order count and thresholds for auto-regulation.

### Outlet Dashboard
Grid of retail outlets showing:
- Current balance
- Retail margin percentage
- Inventory by donut type
- Open/closed status with toggle controls

### Leaderboard
Ranks outlets by net profit:
- Customer sales revenue (selling to customers)
- Exchange sales (selling excess inventory back)
- Net profit since start

### Order Book
Live view of buy and sell orders:
- Filter by donut type
- Shows price, quantity, and time
- Toggle to show/hide filled orders

### Transaction History
Recent trades executed on the exchange.

## Configuration

Key constants in `backend/src/config/constants.ts`:

| Constant                   | Default | Description                                  |
|----------------------------|---------|----------------------------------------------|
| `OUTLET_STARTING_BALANCE`  | 1000    | Initial funds for each outlet                |
| `FACTORY_PAUSE_THRESHOLD`  | 20      | Pause production at this many active orders  |
| `FACTORY_RESUME_THRESHOLD` | 10      | Resume production at this many active orders |

## How Profit Works

An outlet's profit depends on:

1. **Buying low**: Getting donuts from the exchange at good prices
2. **Selling high**: Having customers buy at retail (cost + margin)
3. **Inventory management**: Not running out of stock (lost sales) or overstocking (tied-up capital)

Example:
- Outlet buys donut for $1.80 from exchange
- Outlet has 25% margin
- Customer pays $2.25 ($1.80 × 1.25)
- Profit: $0.45 per donut

## Tech Stack

**Backend**: Node.js, TypeScript, Express, WebSocket, TypeDB 3.x HTTP driver

**Frontend**: Svelte 5, TypeScript, Vite

**Database**: TypeDB 3.x with TypeQL

## License

MIT
