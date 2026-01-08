<script lang="ts">
  import { onMount } from 'svelte';

  interface OutletStats {
    outletId: string;
    outletName: string;
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    customerSalesCount: number;
    averageMargin: number;
  }

  let leaderboard: OutletStats[] = [];
  let loading = true;
  let error = '';

  async function fetchLeaderboard() {
    try {
      loading = true;
      error = '';
      const response = await fetch('http://localhost:3000/api/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      leaderboard = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching leaderboard:', err);
    } finally {
      loading = false;
    }
  }

  function formatCurrency(value: number): string {
    return value.toFixed(2);
  }

  function getRankMedal(index: number): string {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  }

  function getProfitClass(profit: number): string {
    if (profit > 0) return 'profit-positive';
    if (profit < 0) return 'profit-negative';
    return 'profit-neutral';
  }

  onMount(() => {
    fetchLeaderboard();
    // Refresh leaderboard every 5 seconds
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  });
</script>

<div class="leaderboard-container">
  <div class="header">
    <h2>🏆 Outlet Performance Leaderboard</h2>
    <button class="refresh-btn" on:click={fetchLeaderboard} disabled={loading}>
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  </div>

  {#if loading && leaderboard.length === 0}
    <div class="loading">Loading leaderboard...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if leaderboard.length === 0}
    <div class="empty">No outlets to display</div>
  {:else}
    <div class="leaderboard-table">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Outlet</th>
            <th>Margin</th>
            <th>Revenue</th>
            <th>Net Profit</th>
            <th>Sales</th>
          </tr>
        </thead>
        <tbody>
          {#each leaderboard as stats, index (stats.outletId)}
            <tr class="rank-{index + 1}">
              <td class="rank">{getRankMedal(index)}</td>
              <td class="outlet-name">{stats.outletName}</td>
              <td class="margin">{stats.averageMargin}%</td>
              <td class="revenue">${formatCurrency(stats.totalRevenue)}</td>
              <td class="profit {getProfitClass(stats.netProfit)}">
                ${formatCurrency(stats.netProfit)}
              </td>
              <td class="sales-count">{stats.customerSalesCount}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .leaderboard-container {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #1f2937;
  }

  .refresh-btn {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .refresh-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .leaderboard-table {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
  }

  th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: background 0.2s;
  }

  tbody tr:hover {
    background: #f9fafb;
  }

  tbody tr.rank-1 {
    background: #fef3c7;
  }

  tbody tr.rank-1:hover {
    background: #fde68a;
  }

  tbody tr.rank-2 {
    background: #f3f4f6;
  }

  tbody tr.rank-3 {
    background: #fef2f2;
  }

  td {
    padding: 1rem;
    font-size: 0.875rem;
    color: #374151;
  }

  .rank {
    font-size: 1.25rem;
    font-weight: bold;
    text-align: center;
    width: 80px;
  }

  .outlet-name {
    font-weight: 600;
    color: #1f2937;
  }

  .margin {
    font-weight: 500;
    color: #7c3aed;
  }

  .revenue {
    font-weight: 500;
    color: #059669;
  }

  .profit {
    font-weight: 700;
    font-size: 1rem;
  }

  .profit-positive {
    color: #16a34a;
  }

  .profit-negative {
    color: #dc2626;
  }

  .profit-neutral {
    color: #6b7280;
  }

  .sales-count {
    text-align: center;
    font-weight: 500;
    color: #6b7280;
  }

  .loading,
  .error,
  .empty {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
    font-style: italic;
  }

  .error {
    color: #dc2626;
  }

  @media (max-width: 768px) {
    .leaderboard-table {
      font-size: 0.75rem;
    }

    th,
    td {
      padding: 0.5rem;
    }

    .rank {
      font-size: 1rem;
      width: 60px;
    }
  }
</style>
