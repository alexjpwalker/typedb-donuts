<script lang="ts">
  import { transactions, outlets } from '../stores';

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  function formatPrice(price: number): string {
    return price.toFixed(2);
  }

  function getOutletName(outletId: string): string {
    const outlet = $outlets.find(o => o.outletId === outletId);
    return outlet?.outletName || outletId;
  }
</script>

<div class="transaction-history">
  <h2>Recent Trades</h2>

  <div class="transactions-container">
    {#if $transactions.length > 0}
      <div class="transactions-list">
        {#each $transactions as tx (tx.transactionId)}
          <div class="transaction-card">
            <div class="tx-header">
              <span class="tx-time">{formatDate(tx.executedAt)}</span>
              <span class="tx-amount">${formatPrice(tx.totalAmount)}</span>
            </div>
            <div class="tx-details">
              <div class="detail-row">
                <span class="label">Quantity:</span>
                <span class="value">{tx.quantity} donuts</span>
              </div>
              <div class="detail-row">
                <span class="label">Price:</span>
                <span class="value">${formatPrice(tx.pricePerUnit)} per unit</span>
              </div>
              <div class="detail-row">
                <span class="label">Buyer:</span>
                <span class="value buyer">{getOutletName(tx.buyerOutletId)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Seller:</span>
                <span class="value seller">{getOutletName(tx.sellerOutletId)}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty">
        No transactions yet. Place an order to start trading!
      </div>
    {/if}
  </div>
</div>

<style>
  .transaction-history {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
  }

  .transactions-container {
    max-height: 600px;
    overflow-y: auto;
  }

  .transactions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .transaction-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
    transition: all 0.2s;
  }

  .transaction-card:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .tx-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .tx-time {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .tx-amount {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1f2937;
  }

  .tx-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
  }

  .label {
    color: #6b7280;
  }

  .value {
    font-weight: 600;
    color: #1f2937;
  }

  .value.buyer {
    color: #10b981;
  }

  .value.seller {
    color: #ef4444;
  }

  .empty {
    text-align: center;
    padding: 3rem;
    color: #9ca3af;
    font-style: italic;
  }

  /* Scrollbar styling */
  .transactions-container::-webkit-scrollbar {
    width: 8px;
  }

  .transactions-container::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 4px;
  }

  .transactions-container::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
  }

  .transactions-container::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
</style>
