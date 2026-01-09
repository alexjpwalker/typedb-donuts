#!/bin/bash

echo "=============================================="
echo "  Donut Exchange System Status"
echo "=============================================="
echo ""

# Port 3000 status
echo "📡 Port 3000 (Backend Server):"
echo "----------------------------------------------"
PORT_INFO=$(lsof -i :3000 2>/dev/null)
if [ -z "$PORT_INFO" ]; then
  echo "  ❌ No process listening on port 3000"
else
  echo "$PORT_INFO" | head -5
fi
echo ""

# Port 5173 status (Vite dev server)
echo "🖥️  Port 5173 (Frontend Dev Server):"
echo "----------------------------------------------"
VITE_INFO=$(lsof -i :5173 2>/dev/null)
if [ -z "$VITE_INFO" ]; then
  echo "  ❌ No process listening on port 5173"
else
  echo "$VITE_INFO" | head -5
fi
echo ""

# Health check
echo "🏥 Health Check:"
echo "----------------------------------------------"
HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null)
if [ -z "$HEALTH" ]; then
  echo "  ❌ Backend not responding"
else
  echo "  ✅ Backend responding"
  echo "  $HEALTH" | head -1
fi
echo ""

# API endpoints check
echo "📊 API Status:"
echo "----------------------------------------------"

# Outlets
OUTLETS=$(curl -s http://localhost:3000/api/outlets 2>/dev/null)
if [ ! -z "$OUTLETS" ]; then
  OUTLET_COUNT=$(echo "$OUTLETS" | grep -o '"outletId"' | wc -l | tr -d ' ')
  echo "  Outlets: $OUTLET_COUNT"
fi

# Donut types
DONUTS=$(curl -s http://localhost:3000/api/donut-types 2>/dev/null)
if [ ! -z "$DONUTS" ]; then
  DONUT_COUNT=$(echo "$DONUTS" | grep -o '"donutTypeId"' | wc -l | tr -d ' ')
  echo "  Donut Types: $DONUT_COUNT"
fi

# Factory status
FACTORY=$(curl -s http://localhost:3000/api/factory 2>/dev/null)
if [ ! -z "$FACTORY" ]; then
  IS_OPEN=$(echo "$FACTORY" | grep -o '"isOpen":[^,}]*' | cut -d: -f2)
  echo "  Factory Open: $IS_OPEN"
fi

# Order book for glazed
ORDERBOOK=$(curl -s "http://localhost:3000/api/order-book/glazed" 2>/dev/null)
if [ ! -z "$ORDERBOOK" ]; then
  BUY_ORDERS=$(echo "$ORDERBOOK" | grep -o '"buyOrders":\[[^]]*\]' | grep -o '"orderId"' | wc -l | tr -d ' ')
  SELL_ORDERS=$(echo "$ORDERBOOK" | grep -o '"sellOrders":\[[^]]*\]' | grep -o '"orderId"' | wc -l | tr -d ' ')
  echo "  Glazed Order Book: $BUY_ORDERS buy, $SELL_ORDERS sell"
fi

# Leaderboard
LEADERBOARD=$(curl -s http://localhost:3000/api/leaderboard 2>/dev/null)
if [ ! -z "$LEADERBOARD" ]; then
  echo ""
  echo "🏆 Leaderboard (Top 3):"
  echo "----------------------------------------------"
  echo "$LEADERBOARD" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for i, outlet in enumerate(data[:3]):
        print(f\"  {i+1}. {outlet['outletName']}: \${outlet['balance']:.2f} (profit: \${outlet['netProfit']:.2f})\")
except:
    print('  Unable to parse leaderboard')
" 2>/dev/null
fi

echo ""

# Node processes
echo "🔧 Node Processes:"
echo "----------------------------------------------"
NODE_PROCS=$(ps aux | grep -E "node|tsx" | grep -v grep | head -5)
if [ -z "$NODE_PROCS" ]; then
  echo "  No Node.js processes found"
else
  echo "$NODE_PROCS" | awk '{print "  PID: "$2" CPU: "$3"% MEM: "$4"% CMD: "$11" "$12}'
fi
echo ""

# Recent log errors (if log file exists)
echo "📋 Recent Activity (last 10 lines of output):"
echo "----------------------------------------------"
LATEST_LOG=$(ls -t /tmp/claude/-Users-aw-Desktop-workspace-typedb-hackathon-2026/tasks/*.output 2>/dev/null | head -1)
if [ ! -z "$LATEST_LOG" ] && [ -f "$LATEST_LOG" ]; then
  tail -10 "$LATEST_LOG" 2>/dev/null | sed 's/^/  /'
else
  echo "  No recent logs found"
fi

echo ""
echo "=============================================="
echo "  Status check complete"
echo "=============================================="
