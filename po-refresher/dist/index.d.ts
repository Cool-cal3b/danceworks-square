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
export {};
