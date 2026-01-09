<script lang="ts">
  import { errorLog } from '../stores';

  let isExpanded = false;

  function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  function clearErrors() {
    errorLog.set([]);
  }
</script>

<div class="error-log" class:expanded={isExpanded}>
  <div class="header" on:click={() => isExpanded = !isExpanded} on:keypress={() => isExpanded = !isExpanded} role="button" tabindex="0">
    <span class="title">
      Error Log
      {#if $errorLog.length > 0}
        <span class="badge">{$errorLog.length}</span>
      {/if}
    </span>
    <div class="header-actions">
      {#if $errorLog.length > 0}
        <button class="clear-btn" on:click|stopPropagation={clearErrors}>Clear</button>
      {/if}
      <span class="toggle">{isExpanded ? '▼' : '▲'}</span>
    </div>
  </div>

  {#if isExpanded}
    <div class="log-content">
      {#if $errorLog.length === 0}
        <div class="empty">No errors logged</div>
      {:else}
        {#each $errorLog as err (err.timestamp)}
          <div class="error-entry">
            <span class="time">{formatTime(err.timestamp)}</span>
            <span class="source">[{err.source}]</span>
            <span class="message">{err.message}</span>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .error-log {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #1f2937;
    color: #f3f4f6;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.75rem;
    z-index: 1000;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: #111827;
    cursor: pointer;
    user-select: none;
  }

  .header:hover {
    background: #1f2937;
  }

  .title {
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .badge {
    background: #ef4444;
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .clear-btn {
    background: transparent;
    border: 1px solid #6b7280;
    color: #9ca3af;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.7rem;
  }

  .clear-btn:hover {
    background: #374151;
    color: white;
  }

  .toggle {
    color: #9ca3af;
  }

  .log-content {
    max-height: 200px;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .empty {
    text-align: center;
    color: #6b7280;
    padding: 1rem;
  }

  .error-entry {
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid #374151;
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .error-entry:last-child {
    border-bottom: none;
  }

  .time {
    color: #6b7280;
    flex-shrink: 0;
  }

  .source {
    color: #f59e0b;
    flex-shrink: 0;
  }

  .message {
    color: #fca5a5;
    word-break: break-word;
  }

  .expanded .log-content {
    border-top: 1px solid #374151;
  }
</style>
