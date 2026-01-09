<script lang="ts">
  import { onMount } from 'svelte';
  import { outlets } from '../stores';
  import type { Outlet } from '../types';

  // Inventory per outlet: outletId -> { donutTypeId -> quantity }
  let inventories: Record<string, Record<string, number>> = {};
  let inventoryKey = 0;

  function formatBalance(balance: number | undefined): string {
    return balance !== undefined ? balance.toFixed(2) : '0.00';
  }

  function formatMargin(margin: number | undefined): string {
    return margin !== undefined ? `${margin}%` : 'N/A';
  }

  async function fetchInventory(outletId: string) {
    try {
      const response = await fetch(`http://localhost:3000/api/outlets/${outletId}/inventory`);
      if (response.ok) {
        const data = await response.json();
        inventories[outletId] = data;
        inventories = {...inventories};
        inventoryKey++;
      }
    } catch (error) {
      console.error(`Error fetching inventory for ${outletId}:`, error);
    }
  }

  async function fetchAllInventories() {
    for (const outlet of $outlets) {
      await fetchInventory(outlet.outletId);
    }
  }

  function formatInventory(outletId: string): string {
    const inv = inventories[outletId];
    if (!inv) return 'No inventory';
    const items = Object.entries(inv)
      .filter(([_, qty]) => qty > 0)
      .map(([type, qty]) => `${type}: ${qty}`);
    return items.length > 0 ? items.join(', ') : 'No inventory';
  }

  function getTotalInventory(outletId: string): number {
    const inv = inventories[outletId];
    if (!inv) return 0;
    return Object.values(inv).reduce((sum, qty) => sum + qty, 0);
  }

  onMount(() => {
    const interval = setInterval(fetchAllInventories, 2000);
    return () => clearInterval(interval);
  });

  $: if ($outlets.length > 0) {
    fetchAllInventories();
  }

  async function toggleOutlet(outlet: Outlet) {
    const newStatus = !outlet.isOpen;
    try {
      const response = await fetch(`http://localhost:3000/api/outlets/${outlet.outletId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: newStatus })
      });
      if (!response.ok) throw new Error('Failed to toggle outlet');
      outlet.isOpen = newStatus;
      outlets.set($outlets);
    } catch (error) {
      console.error('Error toggling outlet:', error);
    }
  }

  async function toggleAll(isOpen: boolean) {
    try {
      const response = await fetch('http://localhost:3000/api/outlets/toggle-all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen })
      });
      if (!response.ok) throw new Error('Failed to toggle all outlets');
      $outlets.forEach(o => o.isOpen = isOpen);
      outlets.set($outlets);
    } catch (error) {
      console.error('Error toggling all outlets:', error);
    }
  }
</script>

<div class="dashboard-container">
  <div class="section-header">
    <h3>Retail Outlets</h3>
    <div class="toggle-all-buttons">
      <button class="toggle-all-btn open" on:click={() => toggleAll(true)}>Open All</button>
      <button class="toggle-all-btn close" on:click={() => toggleAll(false)}>Close All</button>
    </div>
  </div>

  {#if $outlets.length > 0}
    <div class="outlet-grid">
      {#each $outlets as outlet (outlet.outletId)}
        <div class="outlet-card" class:closed={!outlet.isOpen}>
          <div class="card-header">
            <strong>{outlet.outletName}</strong>
            <span class="badge">${formatBalance(outlet.balance)}</span>
          </div>
          <div class="card-body">
            <span class="location">{outlet.location}</span>
            <span class="margin-info">
              Retail Margin: {formatMargin(outlet.marginPercent)}
              <span class="info-icon" data-tooltip="The markup percentage added to cost basis when selling to customers. A 25% margin means a $2.00 donut sells for $2.50.">i</span>
            </span>
            {#key inventoryKey}
            <div class="inventory-info">
              <span class="inventory-label">Inventory ({getTotalInventory(outlet.outletId)} total):</span>
              <span class="inventory-items">{formatInventory(outlet.outletId)}</span>
            </div>
            {/key}
            <div class="status-controls">
              <span class="status-indicator" class:open={outlet.isOpen} class:closed={!outlet.isOpen}>
                {outlet.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
              <button class="toggle-btn" on:click={() => toggleOutlet(outlet)}>
                {outlet.isOpen ? 'Close' : 'Open'}
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty">No outlets available</div>
  {/if}
</div>

<style>
  .dashboard-container {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  h3 {
    margin: 0;
    font-size: 1.25rem;
  }

  .toggle-all-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .toggle-all-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-all-btn.open {
    background: #10b981;
    color: white;
  }

  .toggle-all-btn.open:hover {
    background: #059669;
  }

  .toggle-all-btn.close {
    background: #ef4444;
    color: white;
  }

  .toggle-all-btn.close:hover {
    background: #dc2626;
  }

  .outlet-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .outlet-card {
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
  }

  .outlet-card.closed {
    opacity: 0.7;
    background: #fef2f2;
    border-color: #fca5a5;
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

  .location {
    display: block;
  }

  .margin-info {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: #7c3aed;
    font-weight: 500;
  }

  .info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin-left: 4px;
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
    background: #e5e7eb;
    border-radius: 50%;
    cursor: help;
    vertical-align: middle;
    position: relative;
  }

  .info-icon:hover {
    background: #d1d5db;
    color: #374151;
  }

  .info-icon::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #1f2937;
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: normal;
    white-space: normal;
    width: 200px;
    text-align: left;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.1s;
    z-index: 100;
    pointer-events: none;
    margin-bottom: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .info-icon:hover::after {
    opacity: 1;
    visibility: visible;
  }

  .inventory-info {
    display: block;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #f0fdf4;
    border-radius: 4px;
    border: 1px solid #bbf7d0;
  }

  .inventory-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #166534;
    margin-bottom: 0.25rem;
  }

  .inventory-items {
    display: block;
    font-size: 0.7rem;
    color: #15803d;
  }

  .status-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
  }

  .status-indicator {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .status-indicator.open {
    background: #d1fae5;
    color: #065f46;
  }

  .status-indicator.closed {
    background: #fee2e2;
    color: #991b1b;
  }

  .toggle-btn {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .toggle-btn:hover {
    background: #4b5563;
  }

  .empty {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
    font-style: italic;
  }
</style>
