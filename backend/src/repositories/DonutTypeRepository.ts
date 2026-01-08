import { TypeDBConnection } from '../config/typedb.js';
import { TransactionHelper } from '../config/transaction-helper.js';
import { DonutType } from '../models/types.js';

export class DonutTypeRepository {
  private connection: TypeDBConnection;
  private helper: TransactionHelper | null = null;

  constructor() {
    this.connection = TypeDBConnection.getInstance();
  }

  private getHelper(): TransactionHelper {
    if (!this.helper) {
      const driver = this.connection.getDriver();
      const dbName = this.connection.getDatabaseName();
      this.helper = new TransactionHelper(driver, dbName);
    }
    return this.helper;
  }

  async create(donutType: DonutType): Promise<DonutType> {
    const query = `
      insert
      $donut isa donut-type,
        has donut-type-id "${donutType.donutTypeId}",
        has donut-name "${donutType.donutName}",
        has description "${donutType.description}";
    `;

    await this.getHelper().executeWriteQuery(query);
    return donutType;
  }

  async findById(donutTypeId: string): Promise<DonutType | null> {
    const query = `
      match
      $donut isa donut-type, has donut-type-id "${donutTypeId}";
      fetch { $donut.* };
    `;

    const response = await this.getHelper().executeReadQuery(query);

    if (response.answerType === 'conceptDocuments' && response.answers.length > 0) {
      const doc = response.answers[0] as any;

      return {
        donutTypeId: doc['donut-type-id'],
        donutName: doc['donut-name'],
        description: doc.description
      };
    }

    return null;
  }

  async findAll(): Promise<DonutType[]> {
    const query = `
      match
      $donut isa donut-type;
      fetch { $donut.* };
    `;

    try {
      const response = await this.getHelper().executeReadQuery(query);

      if (!response) {
        console.log('Empty response from query');
        return [];
      }

      if (response.answerType === 'conceptDocuments' && response.answers) {
        return response.answers.map((doc: any) => ({
          donutTypeId: doc['donut-type-id'],
          donutName: doc['donut-name'],
          description: doc.description
        }));
      }

      console.log('Unexpected response type:', response.answerType);
      return [];
    } catch (error) {
      console.error('Error in findAll:', error);
      return [];
    }
  }
}

