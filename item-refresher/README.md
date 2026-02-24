# Item Refresher (Cloud Run)

Syncs Square catalog (items, variations, inventory) to an Airtable Items table.

**Flow:**
1. Client triggers an Airtable automation (button)
2. Airtable sends HTTP request to this Cloud Run function
3. Function fetches catalog + inventory from Square, clears Items table, and creates records

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SQUARE_ACCESS_TOKEN` | Yes | Square API access token |
| `AIRTABLE_API_KEY` | Yes | Airtable personal access token |
| `AIRTABLE_BASE_ID` | Yes | Airtable base ID |
| `SQUARE_LOCATION_NAMES` | No | Comma-separated (default: `Provo,American Fork`) |
| `TRIGGER_SECRET` | No | If set, requests must include `X-Trigger-Secret` header |
| `PORT` | No | HTTP port (Cloud Run sets this; default 8080) |

## Airtable automation setup

Create an automation triggered by a button that sends HTTP POST to your Cloud Run URL:

```javascript
fetch('https://YOUR-CLOUD-RUN-URL', {
  method: 'POST',
  headers: { 'X-Trigger-Secret': 'YOUR_SECRET' }
});
```

## Deploy to Cloud Run

```bash
cd item-refrsher
gcloud run deploy item-refresher \
  --source . \
  --region us-central1 \
  --set-env-vars "SQUARE_ACCESS_TOKEN=xxx,AIRTABLE_API_KEY=xxx,AIRTABLE_BASE_ID=xxx"
```

## Local testing

1. Copy `.env.test` template and fill in your credentials:
   ```bash
   cp .env.test .env.test.local  # edit this with real values
   ```

2. Build and run test container:
   ```bash
   chmod +x run-local-test.sh
   ./run-local-test.sh
   ```

   Or manually:
   ```bash
   docker build -f Dockerfile.test -t item-refresher-test .
   docker run --rm --env-file .env.test.local item-refresher-test
   ```

This runs the refresh directly (no HTTP server) and shows the result.
