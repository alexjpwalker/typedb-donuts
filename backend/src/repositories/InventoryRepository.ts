import { TypeDBConnection } from '../config/typedb.js';
import { TransactionHelper } from '../config/transaction-helper.js';

export interface InventoryRecord {
  outletId: string;
  donutTypeId: string;
  quantity: number;
  costBasis: number;
}

export class InventoryRepository {
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

  async getInventory(outletId: string, donutTypeId: string): Promise<number> {
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
      $inv isa inventory, has donut-type-id "${donutTypeId}";
      (holder: $outlet, inventory: $inv) isa inventory-holding;
      fetch {
        "quantity": $inv.inventory-quantity
      };
    `;

    try {
      const response = await this.getHelper().executeReadQuery(query);
      if (response.answerType === 'conceptDocuments' && response.answers.length > 0) {
        const doc = response.answers[0] as any;
        return doc.quantity || 0;
      }
    } catch (error) {
      // No inventory found
    }
    return 0;
  }

  async getAllInventoryForOutlet(outletId: string): Promise<Map<string, number>> {
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
      $inv isa inventory;
      (holder: $outlet, inventory: $inv) isa inventory-holding;
      fetch {
        "donutTypeId": $inv.donut-type-id,
        "quantity": $inv.inventory-quantity
      };
    `;

    const result = new Map<string, number>();
    try {
      const response = await this.getHelper().executeReadQuery(query);
      if (response.answerType === 'conceptDocuments') {
        for (const doc of response.answers as any[]) {
          const donutTypeId = doc.donutTypeId;
          const quantity = doc.quantity;
          if (donutTypeId && quantity !== undefined) {
            result.set(donutTypeId, quantity);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
    return result;
  }

  async setInventory(outletId: string, donutTypeId: string, quantity: number, costBasis: number = 0): Promise<void> {
    // First check if inventory record exists
    const existingQty = await this.getInventory(outletId, donutTypeId);

    if (existingQty > 0 || await this.inventoryExists(outletId, donutTypeId)) {
      // Update existing inventory
      const query = `
        match
        $outlet isa outlet, has outlet-id "${outletId}";
        $inv isa inventory, has donut-type-id "${donutTypeId}";
        (holder: $outlet, inventory: $inv) isa inventory-holding;
        update
        $inv has inventory-quantity ${quantity};
      `;
      await this.getHelper().executeWriteQuery(query);
    } else {
      // Create new inventory record with relation
      const query = `
        match
        $outlet isa outlet, has outlet-id "${outletId}";
        insert
        $inv isa inventory,
          has donut-type-id "${donutTypeId}",
          has inventory-quantity ${quantity},
          has cost-basis ${costBasis};
        (holder: $outlet, inventory: $inv) isa inventory-holding;
      `;
      await this.getHelper().executeWriteQuery(query);
    }
  }

  private async inventoryExists(outletId: string, donutTypeId: string): Promise<boolean> {
    const query = `
      match
      $outlet isa outlet, has outlet-id "${outletId}";
      $inv isa inventory, has donut-type-id "${donutTypeId}";
      (holder: $outlet, inventory: $inv) isa inventory-holding;
      fetch {
        "exists": $inv.donut-type-id
      };
    `;

    try {
      const response = await this.getHelper().executeReadQuery(query);
      return response.answerType === 'conceptDocuments' && response.answers.length > 0;
    } catch {
      return false;
    }
  }

  async addInventory(outletId: string, donutTypeId: string, quantity: number, costBasis: number = 0): Promise<void> {
    const currentQty = await this.getInventory(outletId, donutTypeId);
    await this.setInventory(outletId, donutTypeId, currentQty + quantity, costBasis);
  }

  async removeInventory(outletId: string, donutTypeId: string, quantity: number): Promise<boolean> {
    const currentQty = await this.getInventory(outletId, donutTypeId);
    if (currentQty < quantity) {
      return false;
    }
    await this.setInventory(outletId, donutTypeId, currentQty - quantity);
    return true;
  }

  async getAllInventory(): Promise<InventoryRecord[]> {
    const query = `
      match
      $outlet isa outlet;
      $inv isa inventory;
      (holder: $outlet, inventory: $inv) isa inventory-holding;
      fetch {
        "outletId": $outlet.outlet-id,
        "donutTypeId": $inv.donut-type-id,
        "quantity": $inv.inventory-quantity,
        "costBasis": $inv.cost-basis
      };
    `;

    const results: InventoryRecord[] = [];
    try {
      const response = await this.getHelper().executeReadQuery(query);
      if (response.answerType === 'conceptDocuments') {
        for (const doc of response.answers as any[]) {
          results.push({
            outletId: doc.outletId,
            donutTypeId: doc.donutTypeId,
            quantity: doc.quantity || 0,
            costBasis: doc.costBasis || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching all inventory:', error);
    }
    return results;
  }
}
