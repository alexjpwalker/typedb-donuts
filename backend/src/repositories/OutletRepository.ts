import { TypeDBConnection } from '../config/typedb.js';
import { TransactionHelper } from '../config/transaction-helper.js';
import { Outlet } from '../models/types.js';

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

  async create(outlet: Omit<Outlet, 'createdAt'>): Promise<Outlet> {
    // TypeDB expects datetime in ISO 8601 format without timezone (YYYY-MM-DDTHH:MM:SS.sss)
    const now = new Date().toISOString().replace('Z', '');
    const marginPercent = outlet.marginPercent || 25.0; // Default 25% margin
    const query = `
      insert
      $outlet isa outlet,
        has outlet-id "${outlet.outletId}",
        has outlet-name "${outlet.outletName}",
        has location "${outlet.location}",
        has balance ${outlet.balance},
        has margin-percent ${marginPercent},
        has created-at ${now};
    `;

    await this.getHelper().executeWriteQuery(query);

    return {
      ...outlet,
      createdAt: new Date()
    };
  }

  async findById(outletId: string): Promise<Outlet | null> {
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
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
        createdAt: new Date(doc['created-at'])
      };
    }

    return null;
  }

  async findAll(): Promise<Outlet[]> {
    const query = `
      match
      $outlet isa outlet;
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
        createdAt: new Date(doc['created-at'])
      }));
    }

    return [];
  }

  async updateBalance(outletId: string, newBalance: number): Promise<void> {
    // TypeDB 3.x: delete just needs the variable, then insert new value
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
      $outlet has balance $old_bal;
      delete
      $old_bal;
      insert
      $outlet has balance ${newBalance};
    `;

    await this.getHelper().executeWriteQuery(query);
  }

  async updateMargin(outletId: string, newMarginPercent: number): Promise<void> {
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
      $outlet has margin-percent $old_margin;
      delete
      $old_margin;
      insert
      $outlet has margin-percent ${newMarginPercent};
    `;

    await this.getHelper().executeWriteQuery(query);
  }
}
