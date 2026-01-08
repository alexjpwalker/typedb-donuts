import { TypeDBHttpDriver, type TransactionType } from '@typedb/driver-http';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TypeDBConfig {
  addresses: string[];
  username: string;
  password: string;
  database: string;
}

export class TypeDBConnection {
  private static instance: TypeDBConnection;
  private driver: TypeDBHttpDriver | null = null;
  private config: TypeDBConfig;

  private constructor() {
    const addressStr = process.env.TYPEDB_ADDRESS || 'localhost:1729';
    const addresses = addressStr.split(',').map(addr => addr.trim());

    this.config = {
      addresses,
      username: process.env.TYPEDB_USERNAME || 'admin',
      password: process.env.TYPEDB_PASSWORD || 'password',
      database: process.env.TYPEDB_DATABASE || 'donut-exchange'
    };
  }

  public static getInstance(): TypeDBConnection {
    if (!TypeDBConnection.instance) {
      TypeDBConnection.instance = new TypeDBConnection();
    }
    return TypeDBConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.driver) {
      console.log('Already connected to TypeDB');
      return;
    }

    try {
      this.driver = new TypeDBHttpDriver({
        username: this.config.username,
        password: this.config.password,
        addresses: this.config.addresses
      });

      console.log(`Connected to TypeDB at ${this.config.addresses.join(', ')}`);

      // Check if database exists, create if not
      const dbsResponse = await this.driver.getDatabases();

      if ('error' in dbsResponse) {
        throw new Error(`Failed to get databases: ${dbsResponse.error.message}`);
      }

      const databases = dbsResponse.ok?.databases || [];
      const dbExists = databases.some(db => db.name === this.config.database);

      if (!dbExists) {
        const createResponse = await this.driver.createDatabase(this.config.database);
        if ('error' in createResponse) {
          throw new Error(`Failed to create database: ${createResponse.error.message}`);
        }
        console.log(`Created database: ${this.config.database}`);
      } else {
        console.log(`Database exists: ${this.config.database}`);
      }

      // Always ensure schema is loaded
      await this.ensureSchema();
    } catch (error) {
      console.error('Failed to connect to TypeDB:', error);
      throw error;
    }
  }

  public getDriver(): TypeDBHttpDriver {
    if (!this.driver) {
      throw new Error('TypeDB driver not initialized. Call connect() first.');
    }
    return this.driver;
  }

  public getDatabaseName(): string {
    return this.config.database;
  }

  private async ensureSchema(): Promise<void> {
    try {
      // Check if our specific schema exists by looking for the outlet entity type
      const checkQuery = 'match $x type outlet; fetch { "exists": true };';
      const checkResponse = await this.driver!.oneShotQuery(
        checkQuery,
        false,
        this.config.database,
        'read'
      );

      if ('error' in checkResponse) {
        // Schema doesn't exist, load it
        console.log('Schema not found, loading...');
        await this.loadSchema();
      } else if (checkResponse.ok && checkResponse.ok.answerType === 'conceptDocuments' && checkResponse.ok.answers.length > 0) {
        console.log('Schema already loaded');
      } else {
        console.log('Schema check inconclusive, loading...');
        await this.loadSchema();
      }
    } catch (error) {
      // If error checking, try to load schema anyway
      console.log('Unable to check schema, attempting to load...');
      await this.loadSchema();
    }
  }

  private async loadSchema(): Promise<void> {
    try {
      const schemaPath = join(__dirname, '../schema/schema.tql');
      const schemaQuery = readFileSync(schemaPath, 'utf-8');

      console.log('Loading schema from:', schemaPath);
      console.log('Schema query length:', schemaQuery.length, 'characters');

      const response = await this.driver!.oneShotQuery(
        schemaQuery,
        true, // commit
        this.config.database,
        'schema' // transaction type
      );

      console.log('Schema load response:', JSON.stringify(response));

      if ('error' in response) {
        console.error('Schema load failed with error:', response.error);
        throw new Error(`Failed to load schema: ${response.error.message}`);
      }

      if (!response.ok) {
        console.error('No ok property in schema response:', JSON.stringify(response));
        throw new Error('Invalid schema response structure');
      }

      console.log('Schema loaded successfully');
    } catch (error) {
      console.error('Error loading schema:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    // HTTP driver doesn't need explicit closing
    this.driver = null;
    console.log('Disconnected from TypeDB');
  }
}

// Export TransactionType for convenience
export { type TransactionType };
