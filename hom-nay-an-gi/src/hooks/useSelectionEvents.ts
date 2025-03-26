import { useEffect, useRef } from 'react';

// Type for selection update handler
type SelectionUpdateHandler = () => void;

// Global SSE connection to prevent multiple connections
const globalSSEConnection: {
  source: EventSource | null;
  listeners: Set<SelectionUpdateHandler>;
  reconnectAttempts: number;
  reconnectTimer: NodeJS.Timeout | null;
} = {
  source: null,
  listeners: new Set(),
  reconnectAttempts: 0,
  reconnectTimer: null
};

/**
 * React hook for subscribing to real-time selection updates via SSE
 * @param onUpdate Function to call when selections are updated
 */
export function useSelectionSync(onUpdate: SelectionUpdateHandler) {
  // Keep the callback in a ref to avoid dependency issues
  const onUpdateRef = useRef(onUpdate);

  // Update the ref when callback changes
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Initialize or reuse SSE connection
  useEffect(() => {
    // Skip in non-browser environments
    if (typeof window === 'undefined' || !window.EventSource) {
      return;
    }

    function setupConnection() {
      // Don't create new connection if one already exists and is not closed
      if (globalSSEConnection.source &&
        globalSSEConnection.source.readyState !== EventSource.CLOSED) {
        globalSSEConnection.listeners.add(onUpdateRef.current);
        return;
      }

      // Clean up any existing connections
      if (globalSSEConnection.source) {
        globalSSEConnection.source.close();
        globalSSEConnection.source = null;
      }

      if (globalSSEConnection.reconnectTimer) {
        clearTimeout(globalSSEConnection.reconnectTimer);
        globalSSEConnection.reconnectTimer = null;
      }

      try {
        // Add timestamp to bust cache
        const eventSource = new EventSource(`/api/selections/events?t=${Date.now()}`);
        globalSSEConnection.source = eventSource;

        // Add our listener
        globalSSEConnection.listeners.add(onUpdateRef.current);

        // Handle connection open
        eventSource.onopen = () => {
          globalSSEConnection.reconnectAttempts = 0;
        };

        // Handle generic messages
        eventSource.onmessage = () => {
          try {
            // Call all listeners with the data
            globalSSEConnection.listeners.forEach(listener => listener());
          } catch {
          }
        };

        // Handle selection update events specifically
        eventSource.addEventListener('selection-update', () => {
          try {
            // Call all listeners
            globalSSEConnection.listeners.forEach(listener => listener());
          } catch {
          }
        });

        // Handle errors and implement reconnection logic
        eventSource.onerror = () => {
          // Only attempt reconnect if the connection is closed
          if (eventSource.readyState === EventSource.CLOSED) {
            // Implement exponential backoff
            const backoffTime = Math.min(
              1000 * Math.pow(1.5, globalSSEConnection.reconnectAttempts),
              15000
            );
            globalSSEConnection.reconnectAttempts++;

            // Clean up current connection
            eventSource.close();
            globalSSEConnection.source = null;

            // Schedule reconnection
            globalSSEConnection.reconnectTimer = setTimeout(() => {
              if (document.visibilityState !== 'hidden') {
                setupConnection();
              }
            }, backoffTime);
          }
        };
      } catch {
      }
    }

    // Initial connection setup
    setupConnection();

    // Handle page visibility changes
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // If connection is closed or closing, reconnect
        if (!globalSSEConnection.source ||
          globalSSEConnection.source.readyState === EventSource.CLOSED ||
          globalSSEConnection.source.readyState === EventSource.CONNECTING) {
          setupConnection();
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Remove our listener
      globalSSEConnection.listeners.delete(onUpdateRef.current);

      // If no more listeners, close the connection
      if (globalSSEConnection.listeners.size === 0) {
        if (globalSSEConnection.source) {
          globalSSEConnection.source.close();
          globalSSEConnection.source = null;
        }
        if (globalSSEConnection.reconnectTimer) {
          clearTimeout(globalSSEConnection.reconnectTimer);
          globalSSEConnection.reconnectTimer = null;
        }
      }
    };
  }, []);
}
