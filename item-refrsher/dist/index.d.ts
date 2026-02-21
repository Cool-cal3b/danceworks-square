/**
 * Cloud Run HTTP entrypoint.
 * Triggered by Airtable automation via HTTP request.
 *
 * Env vars:
 *   PORT - Cloud Run sets this (default 8080)
 *   SQUARE_ACCESS_TOKEN - Square API token
 *   AIRTABLE_API_KEY, AIRTABLE_BASE_ID - Airtable credentials
 *   TRIGGER_SECRET - optional; if set, request must include X-Trigger-Secret header
 */
export {};
