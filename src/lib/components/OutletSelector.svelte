<script lang="ts">
  import { outlets, donutTypes, selectedOutlet, selectedDonutType } from '../stores';

  function formatBalance(balance: number | undefined): string {
    return balance !== undefined ? balance.toFixed(2) : '0.00';
  }

  function formatMargin(margin: number | undefined): string {
    return margin !== undefined ? `${margin}%` : 'N/A';
  }
</script>

<div class="selector-container">
  <!-- Outlet Selector -->
  <div class="selector-section">
    <h3>Select Outlet</h3>
    {#if $outlets.length > 0}
      <div class="selector-grid">
        {#each $outlets as outlet (outlet.outletId)}
          <button
            class="selector-card"
            class:active={$selectedOutlet?.outletId === outlet.outletId}
            on:click={() => selectedOutlet.set(outlet)}
          >
            <div class="card-header">
              <strong>{outlet.outletName}</strong>
              <span class="badge">${formatBalance(outlet.balance)}</span>
            </div>
            <div class="card-body">
              <span class="location">{outlet.location}</span>
              <span class="margin-info">Retail Margin: {formatMargin(outlet.marginPercent)}</span>
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty">No outlets available</div>
    {/if}
  </div>

  <!-- Donut Type Selector -->
  <div class="selector-section">
    <h3>Select Donut Type</h3>
    {#if $donutTypes.length > 0}
      <div class="selector-grid">
        {#each $donutTypes as donutType (donutType.donutTypeId)}
          <button
            class="selector-card"
            class:active={$selectedDonutType?.donutTypeId === donutType.donutTypeId}
            on:click={() => selectedDonutType.set(donutType)}
          >
            <div class="card-header">
              <strong>{donutType.donutName}</strong>
            </div>
            <div class="card-body">
              <span class="description">{donutType.description}</span>
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty">No donut types available</div>
    {/if}
  </div>
</div>

<style>
  .selector-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .selector-section {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
  }

  .selector-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 0.75rem;
  }

  .selector-card {
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .selector-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }

  .selector-card.active {
    background: #eff6ff;
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .card-header strong {
    font-size: 1rem;
    color: #1f2937;
  }

  .badge {
    background: #10b981;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .card-body {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .location,
  .description {
    display: block;
  }

  .margin-info {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: #7c3aed;
    font-weight: 500;
  }

  .empty {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
    font-style: italic;
  }
</style>
