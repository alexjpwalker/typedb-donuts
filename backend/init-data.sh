#!/bin/bash

echo "Initializing Donut Exchange with sample data..."

# Create donut types
echo "Creating donut types..."
curl -X POST http://localhost:3000/api/donut-types \
  -H "Content-Type: application/json" \
  -d '{"donutTypeId":"glazed","donutName":"Glazed Donut","description":"Classic glazed donut"}'

curl -X POST http://localhost:3000/api/donut-types \
  -H "Content-Type: application/json" \
  -d '{"donutTypeId":"chocolate","donutName":"Chocolate Donut","description":"Rich chocolate donut"}'

curl -X POST http://localhost:3000/api/donut-types \
  -H "Content-Type: application/json" \
  -d '{"donutTypeId":"jelly","donutName":"Jelly Filled","description":"Strawberry jelly filled donut"}'

echo -e "\n\nCreating outlets with different margin strategies..."
echo "Downtown Donuts: 20% margin (Low price, high volume)"
curl -X POST http://localhost:3000/api/outlets \
  -H "Content-Type: application/json" \
  -d '{"outletId":"outlet-1","outletName":"Downtown Donuts","location":"123 Main St","balance":10000,"marginPercent":20,"isOpen":true}'

echo -e "\nUptown Bakery: 35% margin (Premium pricing)"
curl -X POST http://localhost:3000/api/outlets \
  -H "Content-Type: application/json" \
  -d '{"outletId":"outlet-2","outletName":"Uptown Bakery","location":"456 Oak Ave","balance":10000,"marginPercent":35,"isOpen":true}'

echo -e "\nSweet Treats Shop: 50% margin (Luxury brand)"
curl -X POST http://localhost:3000/api/outlets \
  -H "Content-Type: application/json" \
  -d '{"outletId":"outlet-3","outletName":"Sweet Treats Shop","location":"789 Maple Dr","balance":10000,"marginPercent":50,"isOpen":true}'

echo -e "\n\n✅ Sample data initialized!"
echo "Visit http://localhost:5173 to start trading!"
