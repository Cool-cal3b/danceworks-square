/**
 * Airtable API client - delete all records and add new ones.
 */
export default class AirtableClient {
    apiKey;
    baseId;
    constructor() {
        this.apiKey = process.env.AIRTABLE_API_KEY ?? '';
        this.baseId = process.env.AIRTABLE_BASE_ID ?? '';
        if (!this.apiKey || !this.baseId) {
            throw new Error('AIRTABLE_API_KEY and AIRTABLE_BASE_ID env vars are required');
        }
    }
    async deleteAllRecords(tableName) {
        let offset;
        do {
            const url = new URL(`https://api.airtable.com/v0/${this.baseId}/${tableName}`);
            url.searchParams.set('pageSize', '100');
            if (offset)
                url.searchParams.set('offset', offset);
            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            const data = (await res.json());
            const ids = (data.records ?? []).map(r => r.id);
            if (ids.length === 0)
                break;
            const deleteUrl = new URL(`https://api.airtable.com/v0/${this.baseId}/${tableName}`);
            ids.forEach(id => deleteUrl.searchParams.append('records[]', id));
            await fetch(deleteUrl.toString(), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            offset = data.offset;
        } while (offset);
    }
    async addRecords(tableName, records) {
        const BATCH = 10;
        for (let i = 0; i < records.length; i += BATCH) {
            const batch = records.slice(i, i + BATCH);
            const res = await fetch(`https://api.airtable.com/v0/${this.baseId}/${tableName}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ records: batch }),
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Airtable addRecords failed: ${res.status} ${err}`);
            }
        }
    }
}
//# sourceMappingURL=airtable-client.js.map