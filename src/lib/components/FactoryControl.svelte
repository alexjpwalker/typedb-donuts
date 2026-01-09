<script lang="ts">
  import { factoryStatus, toggleFactory, refreshFactory } from '../stores';

  let toggling = false;

  async function handleToggle() {
    if (!$factoryStatus || toggling) return;

    toggling = true;
    try {
      await toggleFactory(!$factoryStatus.factory.isOpen);
    } catch (err) {
      console.error('Failed to toggle factory:', err);
    } finally {
      toggling = false;
    }
  }

  // Refresh factory status periodically
  const refreshInterval = setInterval(() => {
    refreshFactory();
  }, 2000);

  import { onDestroy } from 'svelte';
  onDestroy(() => {
    clearInterval(refreshInterval);
  });

  // Derived state for display
  $: factory = $factoryStatus?.factory;
  $: isEnabled = factory?.isOpen ?? false;
  $: isProducing = factory?.productionEnabled ?? false;
  $: actuallyProducing = isEnabled && isProducing;
  $: activeOrders = $factoryStatus?.activeOrders ?? 0;
  $: pauseThreshold = $factoryStatus?.pauseThreshold ?? 20;
  $: resumeThreshold = $factoryStatus?.resumeThreshold ?? 10;
</script>

<div class="factory-control">
  <div class="factory-header">
    <h3>Donut Factory</h3>
    <span class="factory-location">Industrial District</span>
  </div>

  {#if $factoryStatus}
    <div class="factory-status">
      <div class="status-badges">
        <div class="status-indicator" class:enabled={isEnabled} class:disabled={!isEnabled}>
          {isEnabled ? 'ENABLED' : 'DISABLED'}
        </div>
        {#if isEnabled}
          <div class="production-indicator" class:producing={isProducing} class:paused={!isProducing}>
            {isProducing ? 'PRODUCING' : 'PAUSED'}
          </div>
        {/if}
      </div>
      <button
        class="toggle-btn"
        class:stop={isEnabled}
        class:start={!isEnabled}
        on:click={handleToggle}
        disabled={toggling}
      >
        {#if toggling}
          ...
        {:else if isEnabled}
          Disable Factory
        {:else}
          Enable Factory
        {/if}
      </button>
    </div>
    <p class="factory-info">
      {#if !isEnabled}
        Factory is disabled. Enable it to allow production.
      {:else if actuallyProducing}
        Factory is supplying donuts to the exchange.
      {:else}
        Factory is enabled but production is auto-paused (too many orders in queue).
      {/if}
    </p>
    {#if isEnabled}
      <p class="factory-note">
        Active orders: <strong>{activeOrders}</strong> —
        {#if isProducing}
          will pause at {pauseThreshold}
        {:else}
          will resume at {resumeThreshold} or fewer
        {/if}
      </p>
    {/if}
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

  .status-badges {
    display: flex;
    gap: 0.5rem;
  }

  .status-indicator {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
  }

  .status-indicator.enabled {
    background: #3b82f6;
    color: white;
  }

  .status-indicator.disabled {
    background: #6b7280;
    color: white;
  }

  .production-indicator {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
  }

  .production-indicator.producing {
    background: #10b981;
    color: white;
  }

  .production-indicator.paused {
    background: #f59e0b;
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

  .factory-note {
    margin: 0.5rem 0 0 0;
    font-size: 0.75rem;
    opacity: 0.6;
    font-style: italic;
  }

  .loading {
    margin: 0;
    opacity: 0.7;
    font-style: italic;
  }
</style>
