import { TypeDBHttpDriver } from '@typedb/driver-http';
import dotenv from 'dotenv';

dotenv.config();

async function testBalance() {
  const driver = new TypeDBHttpDriver({
    username: process.env.TYPEDB_USERNAME || 'admin',
    password: process.env.TYPEDB_PASSWORD || 'password',
    addresses: ['https://n69m16-0.cluster.typedb.com:80']
  });

  const database = 'donut-exchange';
  const outletId = 'outlet-1';
  const newBalance = 9999;

  const query = `
    match
    $outlet isa outlet, has outlet-id "${outletId}";
    $outlet has balance $old_bal;
    delete
    $old_bal;
    insert
    $outlet has balance ${newBalance};
  `;

  console.log('Testing balance query:', query);

  try {
    const response = await driver.oneShotQuery(query, true, database, 'write');
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testBalance();
