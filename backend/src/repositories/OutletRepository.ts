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
    const isOpen = outlet.isOpen !== undefined ? outlet.isOpen : true; // Default to open
    const productionEnabled = outlet.productionEnabled !== undefined ? outlet.productionEnabled : true; // Default to enabled

    // Build query - productionEnabled is optional (only for factory)
    let query = `
      insert
      $outlet isa outlet,
        has outlet-id "${outlet.outletId}",
        has outlet-name "${outlet.outletName}",
        has location "${outlet.location}",
        has balance ${outlet.balance},
        has margin-percent ${marginPercent},
        has outlet-open ${isOpen},
        has created-at ${now}`;

    // Only add production-enabled for factory outlets
    if (outlet.outletId === 'supplier-factory') {
      query += `,
        has production-enabled ${productionEnabled}`;
    }

    query += `;`;

    await this.getHelper().executeWriteQuery(query);

    return {
      ...outlet,
      productionEnabled: outlet.outletId === 'supplier-factory' ? productionEnabled : undefined,
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
        isOpen: doc['outlet-open'] !== undefined ? doc['outlet-open'] : true,
        productionEnabled: doc['production-enabled'],
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
        isOpen: doc['outlet-open'] !== undefined ? doc['outlet-open'] : true,
        productionEnabled: doc['production-enabled'],
        createdAt: new Date(doc['created-at'])
      }));
    }

    return [];
  }

  async updateBalance(outletId: string, newBalance: number): Promise<void> {
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
      update
      $outlet has balance ${newBalance};
    `;

    await this.getHelper().executeWriteQuery(query);
  }

  async updateMargin(outletId: string, newMarginPercent: number): Promise<void> {
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
      update
      $outlet has margin-percent ${newMarginPercent};
    `;

    await this.getHelper().executeWriteQuery(query);
  }

  async toggleOpen(outletId: string, isOpen: boolean): Promise<void> {
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
      update
      $outlet has outlet-open ${isOpen};
    `;

    await this.getHelper().executeWriteQuery(query);
  }

  async toggleAllOpen(isOpen: boolean): Promise<void> {
    const query = `
      match
      $outlet isa outlet;
      update
      $outlet has outlet-open ${isOpen};
    `;

    await this.getHelper().executeWriteQuery(query);
  }

  async setProductionEnabled(outletId: string, enabled: boolean): Promise<void> {
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
      update
      $outlet has production-enabled ${enabled};
    `;

    await this.getHelper().executeWriteQuery(query);
  }
}
