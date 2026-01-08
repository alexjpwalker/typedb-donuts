<script lang="ts">
  import { onMount } from 'svelte';
  import { initializeStores, loading, error, selectedOutlet, selectedDonutType } from './lib/stores';
  import OutletSelector from './lib/components/OutletSelector.svelte';
  import OrderBook from './lib/components/OrderBook.svelte';
  import PlaceOrder from './lib/components/PlaceOrder.svelte';
  import TransactionHistory from './lib/components/TransactionHistory.svelte';

  onMount(() => {
    initializeStores();
  });
</script>

<main>
  <header>
    <h1>🍩 Donut Exchange</h1>
    <p class="subtitle">Global marketplace for donut outlets</p>
  </header>

  {#if $loading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Loading exchange data...</p>
    </div>
  {:else if $error}
    <div class="error-container">
      <p>⚠️ Error: {$error}</p>
      <button on:click={() => initializeStores()}>Retry</button>
    </div>
  {:else}
    <!-- Selection Section -->
    <section class="selection-section">
      <OutletSelector />
    </section>

    {#if $selectedOutlet && $selectedDonutType}
      <div class="selected-info">
        Trading as <strong>{$selectedOutlet.outletName}</strong> for <strong>{$selectedDonutType.donutName}</strong>
      </div>
    {/if}

    <!-- Trading Section -->
    <section class="trading-section">
      <div class="left-panel">
        <OrderBook />
        <TransactionHistory />
      </div>
      <div class="right-panel">
        <PlaceOrder />
      </div>
    </section>
  {/if}

  <footer>
    <p>Powered by TypeDB & Svelte</p>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    text-align: center;
    margin-bottom: 2rem;
    color: white;
  }

  h1 {
    font-size: 3rem;
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  }

  .subtitle {
    font-size: 1.25rem;
    margin: 0.5rem 0 0 0;
    opacity: 0.9;
  }

  .loading-container,
  .error-container {
    background: white;
    border-radius: 8px;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .spinner {
    border: 4px solid #f3f4f6;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-container p {
    color: #991b1b;
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }

  .error-container button {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  }

  .error-container button:hover {
    background: #2563eb;
  }

  .selection-section {
    margin-bottom: 2rem;
  }

  .selected-info {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-size: 1.125rem;
  }

  .selected-info strong {
    color: #3b82f6;
  }

  .trading-section {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .left-panel {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .right-panel {
    position: sticky;
    top: 2rem;
    height: fit-content;
  }

  footer {
    text-align: center;
    color: white;
    opacity: 0.8;
    padding: 2rem 0;
    font-size: 0.875rem;
  }

  @media (max-width: 1024px) {
    .trading-section {
      grid-template-columns: 1fr;
    }

    .right-panel {
      position: static;
    }
  }

  @media (max-width: 768px) {
    main {
      padding: 1rem;
    }

    h1 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }
  }
</style>
