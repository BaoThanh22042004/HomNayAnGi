import { connectedClients } from '@/lib/eventService';

export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';

/**
 * Server-Sent Events (SSE) endpoint for real-time updates
 */
export async function GET() {
    const clientId = crypto.randomUUID();
    const encoder = new TextEncoder();

    // Create the SSE stream
    const stream = new ReadableStream({
        start(controller) {
            // Register this client
            connectedClients.add({ id: clientId, controller });

            // Send welcome message with specific event name
            controller.enqueue(encoder.encode(
                `event: connected\ndata: ${JSON.stringify({
                    clientId,
                    message: 'Connected to selection updates'
                })}\n\n`
            ));

            // Send heartbeat every 30 seconds to keep connection alive
            const intervalId = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${Date.now()}\n\n`));
                } catch {
                    clearInterval(intervalId);
                }
            }, 30000);
            clearInterval(intervalId);
        },
        cancel() {
            // Remove this client when they disconnect
            const client = Array.from(connectedClients).find(c => c.id === clientId);
            if (client) {
                connectedClients.delete(client);
            }
        }
    });

    // Return the stream with proper headers
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Disable buffering for Nginx
        }
    });
}
