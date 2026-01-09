<script lang="ts">
  import { orderBook, bestBid, bestAsk, spread } from '../stores';

  function formatPrice(price: number): string {
    return price.toFixed(2);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString();
  }
</script>

<div class="order-book">
  <div class="header">
    <h2>Order Book</h2>
    {#if $bestBid && $bestAsk}
      <div class="spread">
        Spread: ${formatPrice($spread || 0)}
      </div>
    {/if}
  </div>

  {#if $orderBook}
    <div class="book-container">
      <!-- Asks (Sell Orders) -->
      <div class="asks-section">
        <h3 class="section-title sell">Asks (Sell Orders)</h3>
        <div class="orders-header">
          <span>Price</span>
          <span>Quantity</span>
          <span>Time</span>
        </div>
        <div class="orders-list">
          {#each $orderBook.sellOrders as order (order.orderId)}
            <div class="order-row sell">
              <span class="price">${formatPrice(order.pricePerUnit)}</span>
              <span class="quantity">{order.quantity}</span>
              <span class="time">{formatDate(order.createdAt)}</span>
            </div>
          {:else}
            <div class="empty">No sell orders</div>
          {/each}
        </div>
      </div>

      <!-- Market Info -->
      <div class="market-info">
        {#if $bestBid && $bestAsk}
          <div class="mid-price">
            Mid: ${formatPrice(($bestBid.pricePerUnit + $bestAsk.pricePerUnit) / 2)}
          </div>
        {:else}
          <div class="mid-price">No market</div>
        {/if}
      </div>

      <!-- Bids (Buy Orders) -->
      <div class="bids-section">
        <h3 class="section-title buy">Bids (Buy Orders)</h3>
        <div class="orders-header">
          <span>Price</span>
          <span>Quantity</span>
          <span>Time</span>
        </div>
        <div class="orders-list">
          {#each $orderBook.buyOrders as order (order.orderId)}
            <div class="order-row buy">
              <span class="price">${formatPrice(order.pricePerUnit)}</span>
              <span class="quantity">{order.quantity}</span>
              <span class="time">{formatDate(order.createdAt)}</span>
            </div>
          {:else}
            <div class="empty">No buy orders</div>
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <div class="loading">Loading order book...</div>
  {/if}
</div>

<style>
  .order-book {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .spread {
    font-weight: 600;
    color: #666;
  }

  .book-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .asks-section,
  .bids-section {
    flex: 1;
  }

  .section-title {
    font-size: 1.1rem;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }

  .section-title.sell {
    color: #ef4444;
  }

  .section-title.buy {
    color: #10b981;
  }

  .orders-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #f3f4f6;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.875rem;
    color: #666;
  }

  .orders-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .order-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    padding: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
  }

  .order-row.sell {
    background: rgba(239, 68, 68, 0.05);
  }

  .order-row.buy {
    background: rgba(16, 185, 129, 0.05);
  }

  .price {
    font-weight: 600;
  }

  .order-row.sell .price {
    color: #ef4444;
  }

  .order-row.buy .price {
    color: #10b981;
  }

  .quantity {
    color: #374151;
  }

  .time {
    color: #666;
    font-size: 0.8rem;
  }

  .market-info {
    text-align: center;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 4px;
    margin: 1rem 0;
  }

  .mid-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
  }

  .empty {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
    font-style: italic;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
  }
</style>
