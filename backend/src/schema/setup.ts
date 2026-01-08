import { TypeDBConnection } from '../config/typedb.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupSchema() {
  const connection = TypeDBConnection.getInstance();

  try {
    console.log('Connecting to TypeDB...');
    await connection.connect();

    const driver = connection.getDriver();
    const databaseName = connection.getDatabaseName();

    console.log('Loading schema...');
    const schemaPath = join(__dirname, 'schema.tql');
    const schemaQuery = readFileSync(schemaPath, 'utf-8');

    console.log('Defining schema...');
    const response = await driver.oneShotQuery(
      schemaQuery,
      true, // commit
      databaseName,
      'schema' // TransactionType for schema operations
    );

    if ('error' in response) {
      throw new Error(`Schema definition failed: ${response.error.message}`);
    }

    console.log('Schema defined successfully!');
    console.log('Schema setup complete!');
  } catch (error) {
    console.error('Failed to setup schema:', error);
    process.exit(1);
  } finally {
    await connection.close();
  }
}

setupSchema();
