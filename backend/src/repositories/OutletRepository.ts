import { TypeDBConnection } from '../config/typedb.js';
import { TransactionHelper } from '../config/transaction-helper.js';
import { RetailOutlet } from '../models/types.js';

export class OutletRepository {
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

  async create(outlet: Omit<RetailOutlet, 'createdAt'>): Promise<RetailOutlet> {
    const now = new Date().toISOString().replace('Z', '');
    const marginPercent = outlet.marginPercent || 25.0;
    const isOpen = outlet.isOpen !== undefined ? outlet.isOpen : true;

    const query = `
      insert
      $outlet isa retail-outlet,
        has outlet-id "${outlet.outletId}",
        has outlet-name "${outlet.outletName}",
        has location "${outlet.location}",
        has balance ${outlet.balance},
        has margin-percent ${marginPercent},
        has is-open ${isOpen},
        has created-at ${now};
    `;

    await this.getHelper().executeWriteQuery(query);

    return {
      ...outlet,
      marginPercent,
      isOpen,
      createdAt: new Date()
    };
  }

  async findById(outletId: string): Promise<RetailOutlet | null> {
    const query = `
      match
      $outlet isa retail-outlet, has outlet-id "${outletId}";
      fetch { $outlet.* };
    `;

    const response = await this.getHelper().executeReadQuery(query);

    if (response.answerType === 'conceptDocuments' && response.answers.length > 0) {
      const doc = response.answers[0] as any;

      return {
        outletId,
        outletName: doc['outlet-name'],
        location: doc.location,
        balance: doc.balance,
        marginPercent: doc['margin-percent'] || 25.0,
        isOpen: doc['is-open'] !== undefined ? doc['is-open'] : true,
        createdAt: new Date(doc['created-at'])
      };
    }

    return null;
  }

  async findAll(): Promise<RetailOutlet[]> {
    const query = `
      match
      $outlet isa retail-outlet;
      fetch { $outlet.* };
    `;

    const response = await this.getHelper().executeReadQuery(query);

    if (response.answerType === 'conceptDocuments') {
      return response.answers.map((doc: any) => ({
        outletId: doc['outlet-id'],
        outletName: doc['outlet-name'],
        location: doc.location,
        balance: doc.balance,
        marginPercent: doc['margin-percent'] || 25.0,
        isOpen: doc['is-open'] !== undefined ? doc['is-open'] : true,
        createdAt: new Date(doc['created-at'])
      }));
    }

    return [];
  }

  async updateBalance(outletId: string, newBalance: number): Promise<void> {
    const query = `
      match
      $outlet isa retail-outlet, has outlet-id "${outletId}";
      update
      $outlet has balance ${newBalance};
    `;

    await this.getHelper().executeWriteQuery(query);
  }

  async updateMargin(outletId: string, newMarginPercent: number): Promise<void> {
    const query = `
      match
      $outlet isa retail-outlet, has outlet-id "${outletId}";
      update
      $outlet has margin-percent ${newMarginPercent};
    `;

    await this.getHelper().executeWriteQuery(query);
  }

  async toggleOpen(outletId: string, isOpen: boolean): Promise<void> {
    const query = `
      match
      $outlet isa retail-outlet, has outlet-id "${outletId}";
      update
      $outlet has is-open ${isOpen};
    `;

    await this.getHelper().executeWriteQuery(query);
  }

  async toggleAllOpen(isOpen: boolean): Promise<void> {
    const query = `
      match
      $outlet isa retail-outlet;
      update
      $outlet has is-open ${isOpen};
    `;

    await this.getHelper().executeWriteQuery(query);
  }
}
