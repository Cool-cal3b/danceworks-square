/**
 * Airtable API client - delete all records and add new ones.
 */
export interface AirtableRecord {
    fields: Record<string, unknown>;
}
export default class AirtableClient {
    private readonly apiKey;
    private readonly baseId;
    constructor();
    deleteAllRecords(tableName: string): Promise<void>;
    addRecords(tableName: string, records: AirtableRecord[]): Promise<void>;
}
