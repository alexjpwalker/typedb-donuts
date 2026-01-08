import { TypeDBHttpDriver } from '@typedb/driver-http';
import dotenv from 'dotenv';

dotenv.config();

async function resetDatabase() {
  const addressStr = process.env.TYPEDB_ADDRESS || 'localhost:1729';
  const addresses = addressStr.split(',').map(addr => addr.trim());
  const username = process.env.TYPEDB_USERNAME || 'admin';
  const password = process.env.TYPEDB_PASSWORD || 'password';
  const database = process.env.TYPEDB_DATABASE || 'donut-exchange';

  console.log(`Connecting to TypeDB at ${addresses.join(', ')}...`);

  const driver = new TypeDBHttpDriver({
    username,
    password,
    addresses
  });

  try {
    // Check if database exists
    const dbsResponse = await driver.getDatabases();
    if ('error' in dbsResponse) {
      throw new Error(`Failed to get databases: ${dbsResponse.error.message}`);
    }

    const databases = dbsResponse.ok?.databases || [];
    const dbExists = databases.some(db => db.name === database);

    if (dbExists) {
      console.log(`Database '${database}' exists. Deleting...`);
      const deleteResponse = await driver.deleteDatabase(database);

      if ('error' in deleteResponse) {
        throw new Error(`Failed to delete database: ${deleteResponse.error.message}`);
      }

      console.log(`Database '${database}' deleted successfully!`);
    } else {
      console.log(`Database '${database}' does not exist.`);
    }

    // Wait a moment for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create fresh database
    console.log(`Creating fresh database '${database}'...`);
    const createResponse = await driver.createDatabase(database);

    if ('error' in createResponse) {
      throw new Error(`Failed to create database: ${createResponse.error.message}`);
    }

    console.log(`Database '${database}' created successfully!`);
    console.log('Database has been reset. Restart the backend to load the schema.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetDatabase();
