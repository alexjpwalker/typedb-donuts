<script lang="ts">
  import { selectedOutlet, selectedDonutType, refreshOrderBook } from '../stores';
  import { api } from '../api';
  import { OrderSide } from '../types';

  let side: OrderSide = OrderSide.BUY;
  let quantity = 10;
  let pricePerUnit = 2.50;
  let submitting = false;
  let message = '';
  let messageType: 'success' | 'error' | '' = '';

  async function placeOrder() {
    if (!$selectedOutlet || !$selectedDonutType) {
      showMessage('Please select an outlet and donut type', 'error');
      return;
    }

    if (quantity <= 0 || pricePerUnit <= 0) {
      showMessage('Quantity and price must be positive', 'error');
      return;
    }

    submitting = true;
    message = '';

    try {
      const order = await api.createOrder({
        side,
        donutTypeId: $selectedDonutType.donutTypeId,
        quantity,
        pricePerUnit,
        outletId: $selectedOutlet.outletId
      });

      showMessage(
        `Order placed! ${order.status === 'filled' ? 'Fully filled' : order.status === 'partially_filled' ? 'Partially filled' : 'Active'}`,
        'success'
      );

      // Refresh order book
      await refreshOrderBook($selectedDonutType.donutTypeId);

      // Reset form
      quantity = 10;
      pricePerUnit = 2.50;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to place order', 'error');
    } finally {
      submitting = false;
    }
  }

  function showMessage(text: string, type: 'success' | 'error') {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
      messageType = '';
    }, 5000);
  }

  function toggleSide() {
    side = side === OrderSide.BUY ? OrderSide.SELL : OrderSide.BUY;
  }
</script>

<div class="place-order">
  <h2>Place Order</h2>

  {#if !$selectedOutlet}
    <div class="warning">Please select an outlet first</div>
  {:else if !$selectedDonutType}
    <div class="warning">Please select a donut type first</div>
  {:else}
    <form on:submit|preventDefault={placeOrder}>
      <!-- Side selector -->
      <div class="side-selector">
        <button
          type="button"
          class="side-btn"
          class:active={side === OrderSide.BUY}
          class:buy={side === OrderSide.BUY}
          on:click={() => side = OrderSide.BUY}
        >
          Buy
        </button>
        <button
          type="button"
          class="side-btn"
          class:active={side === OrderSide.SELL}
          class:sell={side === OrderSide.SELL}
          on:click={() => side = OrderSide.SELL}
        >
          Sell
        </button>
      </div>

      <!-- Quantity input -->
      <div class="form-group">
        <label for="quantity">Quantity</label>
        <input
          id="quantity"
          type="number"
          bind:value={quantity}
          min="1"
          step="1"
          required
        />
      </div>

      <!-- Price input -->
      <div class="form-group">
        <label for="price">Price per Unit ($)</label>
        <input
          id="price"
          type="number"
          bind:value={pricePerUnit}
          min="0.01"
          step="0.01"
          required
        />
      </div>

      <!-- Total -->
      <div class="total">
        <strong>Total:</strong> ${(quantity * pricePerUnit).toFixed(2)}
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        class="submit-btn"
        class:buy={side === OrderSide.BUY}
        class:sell={side === OrderSide.SELL}
        disabled={submitting}
      >
        {submitting ? 'Placing Order...' : `Place ${side === OrderSide.BUY ? 'Buy' : 'Sell'} Order`}
      </button>

      <!-- Message -->
      {#if message}
        <div class="message" class:success={messageType === 'success'} class:error={messageType === 'error'}>
          {message}
        </div>
      {/if}
    </form>
  {/if}
</div>

<style>
  .place-order {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
  }

  .warning {
    padding: 1rem;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 4px;
    color: #92400e;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .side-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .side-btn {
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    background: white;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .side-btn:hover {
    background: #f9fafb;
  }

  .side-btn.active.buy {
    background: #10b981;
    color: white;
    border-color: #10b981;
  }

  .side-btn.active.sell {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
  }

  input {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .total {
    padding: 1rem;
    background: #f3f4f6;
    border-radius: 4px;
    font-size: 1.125rem;
    text-align: center;
  }

  .submit-btn {
    padding: 1rem;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    font-size: 1rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .submit-btn.buy {
    background: #10b981;
  }

  .submit-btn.buy:hover:not(:disabled) {
    background: #059669;
  }

  .submit-btn.sell {
    background: #ef4444;
  }

  .submit-btn.sell:hover:not(:disabled) {
    background: #dc2626;
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .message {
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    text-align: center;
  }

  .message.success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #10b981;
  }

  .message.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #ef4444;
  }
</style>
