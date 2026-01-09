import { TypeDBHttpDriver } from '@typedb/driver-http';
import { TransactionHelper } from '../config/transaction-helper.js';
import dotenv from 'dotenv';

dotenv.config();

const addressStr = process.env.TYPEDB_ADDRESS || 'localhost:1729';
const addresses = addressStr.split(',').map(addr => addr.trim());

const TYPEDB_DB = process.env.TYPEDB_DATABASE || 'donut-exchange';
const TYPEDB_USER = process.env.TYPEDB_USERNAME || 'admin';
const TYPEDB_PASSWORD = process.env.TYPEDB_PASSWORD || 'password';

async function test() {
  // Connect directly without TypeDBConnection to skip schema loading
  console.log('Connecting to TypeDB at', addresses[0], 'as', TYPEDB_USER);
  const driver = new TypeDBHttpDriver({
    username: TYPEDB_USER,
    password: TYPEDB_PASSWORD,
    addresses: addresses
  });
  console.log('Connected');

  const helper = new TransactionHelper(driver, TYPEDB_DB);

  // First, try inserting an order directly
  const orderId = `test-order-${Date.now()}`;
  const now = new Date().toISOString().replace('Z', ''); // TypeDB 3.x datetime (no timezone)

  console.log('Creating test order...');
  const insertQuery = `insert $order isa sell-order, has order-id "${orderId}", has quantity 5, has price-per-unit 2.50, has status "active", has created-at ${now}, has updated-at ${now};`;
  console.log('Insert query:', insertQuery);
  try {
    const insertResult = await helper.executeWriteQuery(insertQuery);
    console.log('Insert result:', JSON.stringify(insertResult, null, 2));
  } catch (error) {
    console.error('Insert error:', error);
  }

  // Now fetch all sell orders
  console.log('Fetching sell orders...');
  const query = `match $o isa sell-order; fetch { "id": $o.order-id, "status": $o.status };`;
  console.log('Query:', query);
  const result = await helper.executeReadQuery(query);
  console.log('Result:', JSON.stringify(result, null, 2));

  // Query order-placement relations
  const placementQuery = `match $p isa order-placement; fetch { "donut": $p.donut-type-id };`;
  console.log('Placement Query:', placementQuery);
  const placementResult = await helper.executeReadQuery(placementQuery);
  console.log('Placement Result:', JSON.stringify(placementResult, null, 2));
}

test().catch(console.error);
