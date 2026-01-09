import { TypeDBConnection } from '../config/typedb.js';
import { TransactionHelper } from '../config/transaction-helper.js';
import { CustomerSale } from '../models/types.js';

export class CustomerSaleRepository {
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

  private formatDateTime(date: Date): string {
    return date.toISOString().replace('Z', '');
  }

  async create(sale: CustomerSale): Promise<CustomerSale> {
    const now = this.formatDateTime(sale.executedAt);

    // Insert the customer-sale-record entity
    const insertSale = `
      insert $sale isa customer-sale-record,
        has sale-id "${sale.saleId}",
        has quantity ${sale.quantity},
        has cost-basis ${sale.costBasis},
        has revenue ${sale.revenue},
        has profit ${sale.profit},
        has executed-at ${now};
    `;

    await this.getHelper().executeWriteQuery(insertSale);

    // Create the customer-sale relation
    const insertRelation = `
      match
        $sale isa customer-sale-record, has sale-id "${sale.saleId}";
        $outlet isa outlet, has outlet-id "${sale.outletId}";
      insert
        (seller: $outlet, sale: $sale) isa customer-sale,
          has donut-type-id "${sale.donutTypeId}";
    `;

    await this.getHelper().executeWriteQuery(insertRelation);

    return sale;
  }

  async findByOutlet(outletId: string): Promise<CustomerSale[]> {
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
      $sale isa customer-sale-record;
      (seller: $outlet, sale: $sale) isa customer-sale, has donut-type-id $dtype;
      fetch {
        "saleId": $sale.sale-id,
        "quantity": $sale.quantity,
        "costBasis": $sale.cost-basis,
        "revenue": $sale.revenue,
        "profit": $sale.profit,
        "executedAt": $sale.executed-at,
        "donutTypeId": $dtype
      };
    `;

    const results: CustomerSale[] = [];
    try {
      const response = await this.getHelper().executeReadQuery(query);
      if (response.answerType === 'conceptDocuments') {
        for (const doc of response.answers as any[]) {
          results.push({
            saleId: doc.saleId,
            outletId: outletId,
            donutTypeId: doc.donutTypeId,
            quantity: doc.quantity,
            costBasis: doc.costBasis,
            revenue: doc.revenue,
            profit: doc.profit,
            executedAt: new Date(doc.executedAt)
          });
        }
      }
    } catch (error) {
      console.error('Error fetching customer sales:', error);
    }
    return results;
  }

  async getOutletSalesStats(outletId: string): Promise<{ revenue: number; count: number }> {
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
      $sale isa customer-sale-record, has revenue $rev;
      (seller: $outlet, sale: $sale) isa customer-sale;
      fetch {
        "revenue": $rev
      };
    `;

    let totalRevenue = 0;
    let count = 0;
    try {
      const response = await this.getHelper().executeReadQuery(query);
      if (response.answerType === 'conceptDocuments') {
        for (const doc of response.answers as any[]) {
          totalRevenue += doc.revenue || 0;
          count++;
        }
      }
    } catch (error) {
      console.error('Error fetching sales stats:', error);
    }
    return { revenue: totalRevenue, count };
  }

  async getAllOutletSalesStats(): Promise<Map<string, { revenue: number; count: number }>> {
    const query = `
      match
      $outlet isa outlet, has outlet-id $oid;
      $sale isa customer-sale-record, has revenue $rev;
      (seller: $outlet, sale: $sale) isa customer-sale;
      fetch {
        "outletId": $oid,
        "revenue": $rev
      };
    `;

    const stats = new Map<string, { revenue: number; count: number }>();
    try {
      const response = await this.getHelper().executeReadQuery(query);
      if (response.answerType === 'conceptDocuments') {
        for (const doc of response.answers as any[]) {
          const outletId = doc.outletId;
          const revenue = doc.revenue || 0;
          if (!stats.has(outletId)) {
            stats.set(outletId, { revenue: 0, count: 0 });
          }
          const current = stats.get(outletId)!;
          current.revenue += revenue;
          current.count += 1;
        }
      }
    } catch (error) {
      console.error('Error fetching all sales stats:', error);
    }
    return stats;
  }
}
