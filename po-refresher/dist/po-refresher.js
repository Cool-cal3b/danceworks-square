/**
 * PO Refresher - orchestrates GCS → Airtable sync.
 * 1. List all CSV files in GCS bucket
 * 2. Read and parse each file
 * 3. Clear all records in PO Airtable table
 * 4. Create one Airtable record per CSV row
 */
import GcsClient from './gcs-client.js';
import AirtableClient from './airtable-client.js';
import { parseCsvToRecords } from './csv-parser.js';
const PO_TABLE_NAME = process.env.PO_TABLE_NAME ?? 'PO';
function recordToAirtableFields(record) {
    const fields = {};
    for (const [key, value] of Object.entries(record)) {
        if (value === '' || value === null || value === undefined)
            continue;
        fields[key] = value;
    }
    return fields;
}
export default class PORefresher {
    async refresh() {
        const gcs = new GcsClient();
        const airtable = new AirtableClient();
        const csvFiles = await gcs.getAllCsvFiles();
        if (csvFiles.length === 0) {
            return { filesProcessed: 0, recordsCreated: 0 };
        }
        const allRecords = [];
        for (const file of csvFiles) {
            const rows = parseCsvToRecords(file.content);
            for (const row of rows) {
                allRecords.push({ fields: recordToAirtableFields(row) });
            }
        }
        await airtable.deleteAllRecords(PO_TABLE_NAME);
        await airtable.addRecords(PO_TABLE_NAME, allRecords);
        return {
            filesProcessed: csvFiles.length,
            recordsCreated: allRecords.length,
        };
    }
}
//# sourceMappingURL=po-refresher.js.map