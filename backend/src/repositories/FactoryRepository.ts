import { TypeDBConnection } from '../config/typedb.js';
import { TransactionHelper } from '../config/transaction-helper.js';
import { Factory } from '../models/types.js';

export class FactoryRepository {
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

  async create(factory: Omit<Factory, 'createdAt'>): Promise<Factory> {
    const now = new Date().toISOString().replace('Z', '');
    const isOpen = factory.isOpen !== undefined ? factory.isOpen : true;
    const productionEnabled = factory.productionEnabled !== undefined ? factory.productionEnabled : true;

    const query = `
      insert
      $factory isa factory,
        has factory-id "${factory.factoryId}",
        has factory-name "${factory.factoryName}",
        has location "${factory.location}",
        has balance ${factory.balance},
        has is-open ${isOpen},
        has production-enabled ${productionEnabled},
        has created-at ${now};
    `;

    await this.getHelper().executeWriteQuery(query);

    return {
      ...factory,
      isOpen,
      productionEnabled,
      createdAt: new Date()
    };
  }

  async findById(factoryId: string): Promise<Factory | null> {
    const query = `
      match
      $factory isa factory, has factory-id "${factoryId}";
      fetch { $factory.* };
    `;

    const response = await this.getHelper().executeReadQuery(query);

    if (response.answerType === 'conceptDocuments' && response.answers.length > 0) {
      const doc = response.answers[0] as any;

      return {
        factoryId,
        factoryName: doc['factory-name'],
        location: doc.location,
        balance: doc.balance,
        isOpen: doc['is-open'] !== undefined ? doc['is-open'] : true,
        productionEnabled: doc['production-enabled'] !== undefined ? doc['production-enabled'] : true,
        createdAt: new Date(doc['created-at'])
      };
    }

    return null;
  }

  async findFirst(): Promise<Factory | null> {
    const query = `
      match
      $factory isa factory;
      fetch { $factory.* };
    `;

    const response = await this.getHelper().executeReadQuery(query);

    if (response.answerType === 'conceptDocuments' && response.answers.length > 0) {
      const doc = response.answers[0] as any;

      return {
        factoryId: doc['factory-id'],
        factoryName: doc['factory-name'],
        location: doc.location,
        balance: doc.balance,
        isOpen: doc['is-open'] !== undefined ? doc['is-open'] : true,
        productionEnabled: doc['production-enabled'] !== undefined ? doc['production-enabled'] : true,
        createdAt: new Date(doc['created-at'])
      };
    }

    return null;
  }

  async updateBalance(factoryId: string, newBalance: number): Promise<void> {
    const query = `
      match
      $factory isa factory, has factory-id "${factoryId}";
      update
      $factory has balance ${newBalance};
    `;

    await this.getHelper().executeWriteQuery(query);
  }

  async toggleOpen(factoryId: string, isOpen: boolean): Promise<void> {
    const query = `
      match
      $factory isa factory, has factory-id "${factoryId}";
      update
      $factory has is-open ${isOpen};
    `;

    await this.getHelper().executeWriteQuery(query);
  }

  async setProductionEnabled(factoryId: string, enabled: boolean): Promise<void> {
    const query = `
      match
      $factory isa factory, has factory-id "${factoryId}";
      update
      $factory has production-enabled ${enabled};
    `;

    await this.getHelper().executeWriteQuery(query);
  }
}
