export default class AirtableAPI {
    private readonly API_KEY;
    private readonly AIRTABLE_BASE_ID;
    deleteAllRecords(tableName: string): Promise<void>;
    addRecords(tableName: string, records: AirtableRecord[]): Promise<void>;
}
interface AirtableRecord {
    fields: Record<string, unknown>;
}
export {};
