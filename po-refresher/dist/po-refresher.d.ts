/**
 * PO Refresher - orchestrates GCS → Airtable sync.
 * 1. List all CSV files in GCS bucket
 * 2. Read and parse each file
 * 3. Clear all records in PO Airtable table
 * 4. Create one Airtable record per CSV row
 */
export default class PORefresher {
    refresh(): Promise<{
        filesProcessed: number;
        recordsCreated: number;
    }>;
}
