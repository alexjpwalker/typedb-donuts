import { TypeDBHttpDriver } from '@typedb/driver-http';
import dotenv from 'dotenv';

dotenv.config();

async function resetDatabase() {
  const addressStr = process.env.TYPEDB_ADDRESS || 'localhost:1729';
  const addresses = addressStr.split(',').map(addr => addr.trim());
  const database = process.env.TYPEDB_DATABASE || 'donut-exchange';

  const driver = new TypeDBHttpDriver({
    username: process.env.TYPEDB_USERNAME || 'admin',
    password: process.env.TYPEDB_PASSWORD || 'password',
    addresses
  });

  console.log(`Connecting to TypeDB at ${addresses.join(', ')}...`);

  try {
    // Delete the database if it exists
    console.log(`Deleting database: ${database}...`);
    const deleteResponse = await driver.deleteDatabase(database);
    console.log('Delete response:', deleteResponse);
    console.log(`Database ${database} deleted successfully`);
  } catch (error) {
    console.log(`Database ${database} might not exist, continuing...`);
  }

  console.log('Done! Restart the server to recreate the database with fresh schema.');
}

resetDatabase().catch(console.error);
