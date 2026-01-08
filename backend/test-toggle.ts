import { TypeDBHttpDriver } from '@typedb/driver-http';
import dotenv from 'dotenv';

dotenv.config();

async function testToggle() {
  const driver = new TypeDBHttpDriver({
    username: process.env.TYPEDB_USERNAME || 'admin',
    password: process.env.TYPEDB_PASSWORD || 'password',
    addresses: ['https://n69m16-0.cluster.typedb.com:80']
  });

  const database = 'donut-exchange';
  const outletId = 'outlet-1';
  const isOpen = true;

  const query = `
    match
    $outlet isa outlet, has outlet-id "${outletId}";
    $outlet has outlet-open $old_open;
    delete
    $old_open;
    insert
    $outlet has outlet-open ${isOpen};
  `;

  console.log('Testing query:', query);

  try {
    const response = await driver.oneShotQuery(query, true, database, 'write');
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testToggle();
