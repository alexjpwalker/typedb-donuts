<script lang="ts">
  import { factory, toggleFactory, refreshFactory } from '../stores';

  let toggling = false;

  async function handleToggle() {
    if (!$factory || toggling) return;

    toggling = true;
    try {
      await toggleFactory(!$factory.isOpen);
    } catch (err) {
      console.error('Failed to toggle factory:', err);
    } finally {
      toggling = false;
    }
  }

  // Refresh factory status periodically
  const refreshInterval = setInterval(() => {
    refreshFactory();
  }, 5000);

  import { onDestroy } from 'svelte';
  onDestroy(() => {
    clearInterval(refreshInterval);
  });
</script>

<div class="factory-control">
  <div class="factory-header">
    <h3>Donut Factory</h3>
    <span class="factory-location">Industrial District</span>
  </div>

  {#if $factory}
    <div class="factory-status">
      <div class="status-indicator" class:open={$factory.isOpen} class:closed={!$factory.isOpen}>
        {$factory.isOpen ? 'PRODUCING' : 'STOPPED'}
      </div>
      <button
        class="toggle-btn"
        class:stop={$factory.isOpen}
        class:start={!$factory.isOpen}
        on:click={handleToggle}
        disabled={toggling}
      >
        {#if toggling}
          ...
        {:else if $factory.isOpen}
          Stop Production
        {:else}
          Start Production
        {/if}
      </button>
    </div>
    <p class="factory-info">
      {#if $factory.isOpen}
        Factory is supplying donuts to the exchange every 5 seconds.
      {:else}
        Factory is idle. No new supply entering the market.
      {/if}
    </p>
  {:else}
    <p class="loading">Loading factory status...</p>
  {/if}
</div>

<style>
  .factory-control {
    background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
    border-radius: 8px;
    padding: 1rem 1.5rem;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .factory-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  h3::before {
    content: '';
  }

  .factory-location {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  .factory-status {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .status-indicator {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
  }

  .status-indicator.open {
    background: #10b981;
    color: white;
  }

  .status-indicator.closed {
    background: #6b7280;
    color: white;
  }

  .toggle-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .toggle-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .toggle-btn.stop {
    background: #ef4444;
    color: white;
  }

  .toggle-btn.stop:hover:not(:disabled) {
    background: #dc2626;
  }

  .toggle-btn.start {
    background: #10b981;
    color: white;
  }

  .toggle-btn.start:hover:not(:disabled) {
    background: #059669;
  }

  .factory-info {
    margin: 0;
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .loading {
    margin: 0;
    opacity: 0.7;
    font-style: italic;
  }
</style>
