import dotenv from 'dotenv';
import { OUTLET_STARTING_BALANCE } from '../config/constants.js';

dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 3000}/api`;

async function createDonutType(id: string, name: string, description: string) {
  const response = await fetch(`${API_URL}/donut-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ donutTypeId: id, donutName: name, description })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create donut type ${id}: ${JSON.stringify(error)}`);
  }
  console.log(`Created donut type: ${name}`);
}

async function createOutlet(id: string, name: string, location: string, balance: number, marginPercent: number, isOpen: boolean) {
  const response = await fetch(`${API_URL}/outlets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outletId: id, outletName: name, location, balance, marginPercent, isOpen })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create outlet ${id}: ${JSON.stringify(error)}`);
  }
  console.log(`Created outlet: ${name} (${marginPercent}% margin, ${isOpen ? 'open' : 'closed'})`);
}

async function initData() {
  console.log('Initializing Donut Exchange with sample data...\n');

  // Create donut types
  console.log('Creating donut types...');
  await createDonutType('glazed', 'Glazed Donut', 'Classic glazed donut');
  await createDonutType('chocolate', 'Chocolate Donut', 'Rich chocolate donut');
  await createDonutType('jelly', 'Jelly Filled', 'Strawberry jelly filled donut');

  console.log('\nCreating outlets with different margin strategies...');
  // All retail outlets start closed and with no inventory
  await createOutlet('outlet-1', 'Downtown Donuts', '123 Main St', OUTLET_STARTING_BALANCE, 20, false);
  await createOutlet('outlet-2', 'Uptown Bakery', '456 Oak Ave', OUTLET_STARTING_BALANCE, 35, false);
  await createOutlet('outlet-3', 'Sweet Treats Shop', '789 Maple Dr', OUTLET_STARTING_BALANCE, 50, false);

  // Note: supplier-factory is created automatically by the DonutSupplier service on server startup

  console.log('\n✅ Sample data initialized!');
  console.log('Outlets start CLOSED with NO inventory.');
  console.log('Open outlets and place buy orders on the exchange to get inventory.');
  console.log('Visit http://localhost:5173 to start trading!');
}

initData().catch(err => {
  console.error('Error initializing data:', err.message);
  process.exit(1);
});
