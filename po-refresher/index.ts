/**
 * Cloud Run HTTP entrypoint.
 * Triggered by Airtable automation via HTTP request.
 *
 * Env vars:
 *   PORT - Cloud Run sets this (default 8080)
 *   GCS_BUCKET_NAME - bucket containing PO CSV files
 *   AIRTABLE_API_KEY, AIRTABLE_BASE_ID - Airtable credentials
 *   PO_TABLE_NAME - Airtable table name (default: PO)
 *   TRIGGER_SECRET - optional; if set, request must include X-Trigger-Secret header
 */

import http from 'node:http';
import PORefresher from './po-refresher.js';

const PORT = parseInt(process.env.PORT ?? '8080', 10);
const TRIGGER_SECRET = process.env.TRIGGER_SECRET;

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const send = (status: number, body: unknown) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(body));
    };

    if (req.method === 'GET' && req.url === '/health') {
        send(200, { status: 'ok' });
        return;
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
        send(405, { error: 'Method not allowed' });
        return;
    }

    if (TRIGGER_SECRET) {
        const secret = req.headers['x-trigger-secret'] ?? req.headers.authorization?.replace(/^Bearer\s+/i, '');
        if (secret !== TRIGGER_SECRET) {
            send(401, { error: 'Unauthorized' });
            return;
        }
    }

    try {
        const refresher = new PORefresher();
        const result = await refresher.refresh();
        send(200, { success: true, ...result });
    } catch (err) {
        console.error('PO refresh failed:', err);
        send(500, {
            error: 'PO refresh failed',
            message: err instanceof Error ? err.message : String(err),
        });
    }
}

const server = http.createServer(async (req, res) => {
    try {
        await handleRequest(req, res);
    } catch (err) {
        console.error('Request error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
});

server.listen(PORT, () => {
    console.log(`PO Refresher listening on port ${PORT}`);
});
