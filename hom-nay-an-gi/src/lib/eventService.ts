/**
 * Server-side event service for real-time updates
 */

// Store for connected clients
export const connectedClients = new Set<{
  id: string;
  controller: ReadableStreamDefaultController;
}>();

/**
 * Notify all connected clients about a selection change
 */
export function broadcastSelectionUpdate() {
  if (connectedClients.size === 0) {
    return;
  }
  
  // Create a properly formatted SSE message with explicit event name
  const message = `event: selection-update\ndata: ${JSON.stringify({ 
    timestamp: Date.now() 
  })}\n\n`;
  
  const encoder = new TextEncoder();
  const event = encoder.encode(message);
  
  // Track clients that might need to be removed
  const deadClients = new Set<string>();
  
  // Send the event to all connected clients
  connectedClients.forEach(client => {
    try {
      client.controller.enqueue(event);
    } catch {
      deadClients.add(client.id);
    }
  });
  
  // Clean up any dead connections
  if (deadClients.size > 0) {
    for (const clientId of deadClients) {
      const client = Array.from(connectedClients).find(c => c.id === clientId);
      if (client) {
        connectedClients.delete(client);
      }
    }
  }
}
