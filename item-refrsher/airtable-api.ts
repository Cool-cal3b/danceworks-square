export default class AirtableAPI {
    private readonly API_KEY: string = process.env.AIRTABLE_API_KEY!;
    private readonly AIRTABLE_BASE_ID: string = process.env.AIRTABLE_BASE_ID!;

    async deleteAllRecords(tableName: string) {
        let hasMore = true;
        while (hasMore) {
            const listResponse = await fetch(
                `https://api.airtable.com/v0/${this.AIRTABLE_BASE_ID}/${tableName}?pageSize=100`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.API_KEY}`
                    }
                }
            );
            const listData = await listResponse.json() as { records: { id: string }[], offset?: string };
            const recordIds = listData.records.map(r => r.id);

            if (recordIds.length === 0) {
                break;
            }

            const deleteParams = recordIds.map(id => `records[]=${id}`).join('&');
            await fetch(
                `https://api.airtable.com/v0/${this.AIRTABLE_BASE_ID}/${tableName}?${deleteParams}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.API_KEY}`
                    }
                }
            );

            hasMore = !!listData.offset;
        }
    }

    async addRecords(tableName: string, records: AirtableRecord[]) {
        const response = await fetch(`https://api.airtable.com/v0/${this.AIRTABLE_BASE_ID}/${tableName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records })
        });
        return response.ok;
    }
}

interface AirtableRecord {
    fields: Record<string, unknown>;
}