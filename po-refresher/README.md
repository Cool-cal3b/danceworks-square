# PO Refresher (Cloud Run)

Syncs Purchase Order CSV files from Google Cloud Storage to an Airtable table.

**Flow:**
1. Client exports each PO as CSV and uploads to a GCS bucket
2. Client triggers an Airtable automation (button)
3. Airtable sends HTTP request to this Cloud Run function
4. Function lists all `.csv` files in the bucket, clears the PO table, and creates one Airtable record per row

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GCS_BUCKET_NAME` | Yes | GCS bucket containing PO CSV files |
| `AIRTABLE_API_KEY` | Yes | Airtable personal access token |
| `AIRTABLE_BASE_ID` | Yes | Airtable base ID |
| `PO_TABLE_NAME` | No | Airtable table name (default: `PO`) |
| `TRIGGER_SECRET` | No | If set, requests must include `X-Trigger-Secret` header |
| `PORT` | No | HTTP port (Cloud Run sets this; default 8080) |

## Airtable automation setup

1. Create an automation triggered by a button
2. Add action: "Run script" or use a webhook extension (e.g. Make, Zapier) to send HTTP POST to your Cloud Run URL
3. If using a simple "Run script" with `fetch`, call:
   ```javascript
   fetch('https://YOUR-CLOUD-RUN-URL', {
     method: 'POST',
     headers: { 'X-Trigger-Secret': 'YOUR_SECRET' }
   });
   ```

## GCS permissions

The Cloud Run service account needs **Storage Object Viewer** on the bucket (or `roles/storage.objectViewer`).

## Deploy to Cloud Run

```bash
cd po-refresher
gcloud run deploy po-refresher \
  --source . \
  --region us-central1 \
  --set-env-vars "GCS_BUCKET_NAME=your-bucket,AIRTABLE_API_KEY=xxx,AIRTABLE_BASE_ID=xxx" \
  --set-secrets "TRIGGER_SECRET=trigger-secret:latest"  # optional
```

## CSV → Airtable mapping

CSV column headers are used as Airtable field names. Ensure your export column names match the Airtable field names exactly.
