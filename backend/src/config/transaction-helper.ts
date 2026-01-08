import type { TypeDBHttpDriver, QueryResponse, TransactionType } from '@typedb/driver-http';

export class TransactionHelper {
  constructor(
    private driver: TypeDBHttpDriver,
    private databaseName: string
  ) {}

  /**
   * Execute a query in a single transaction (automatically commits)
   */
  async executeQuery(
    query: string,
    transactionType: TransactionType = 'write'
  ): Promise<QueryResponse> {
    const response = await this.driver.oneShotQuery(
      query,
      true, // commit
      this.databaseName,
      transactionType
    );

    if ('error' in response) {
      throw new Error(`Query failed: ${response.error.message}`);
    }

    if (!response.ok) {
      console.error('No ok property in response:', JSON.stringify(response));
      throw new Error('Invalid response structure from TypeDB');
    }

    return response.ok;
  }

  /**
   * Execute a read query
   */
  async executeReadQuery(query: string): Promise<QueryResponse> {
    return this.executeQuery(query, 'read');
  }

  /**
   * Execute a write query
   */
  async executeWriteQuery(query: string): Promise<QueryResponse> {
    return this.executeQuery(query, 'write');
  }

  /**
   * Execute multiple queries in a single transaction
   */
  async executeTransaction(
    queries: string[],
    transactionType: TransactionType = 'write'
  ): Promise<QueryResponse[]> {
    // Open transaction
    const openResponse = await this.driver.openTransaction(
      this.databaseName,
      transactionType
    );

    if ('error' in openResponse) {
      throw new Error(`Failed to open transaction: ${openResponse.error.message}`);
    }

    const transactionId = openResponse.ok.transactionId;
    const results: QueryResponse[] = [];

    try {
      // Execute all queries
      for (const query of queries) {
        const response = await this.driver.query(transactionId, query);

        if ('error' in response) {
          await this.driver.rollbackTransaction(transactionId);
          throw new Error(`Query failed: ${response.error.message}`);
        }

        results.push(response.ok);
      }

      // Commit transaction
      const commitResponse = await this.driver.commitTransaction(transactionId);

      if ('error' in commitResponse) {
        throw new Error(`Failed to commit transaction: ${commitResponse.error.message}`);
      }

      return results;
    } catch (error) {
      // Rollback on error
      await this.driver.rollbackTransaction(transactionId);
      throw error;
    }
  }
}
