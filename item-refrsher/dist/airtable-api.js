export default class AirtableAPI {
    API_KEY = process.env.AIRTABLE_API_KEY;
    AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    async deleteAllRecords(tableName) {
        let hasMore = true;
        while (hasMore) {
            const listResponse = await fetch(`https://api.airtable.com/v0/${this.AIRTABLE_BASE_ID}/${tableName}?pageSize=100`, {
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`
                }
            });
            const listData = await listResponse.json();
            const recordIds = listData.records.map(r => r.id);
            if (recordIds.length === 0) {
                break;
            }
            const deleteParams = recordIds.map(id => `records[]=${id}`).join('&');
            await fetch(`https://api.airtable.com/v0/${this.AIRTABLE_BASE_ID}/${tableName}?${deleteParams}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`
                }
            });
            hasMore = !!listData.offset;
        }
    }
    async addRecords(tableName, records) {
        const response = await fetch(`https://api.airtable.com/v0/${this.AIRTABLE_BASE_ID}/${tableName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records })
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Airtable addRecords failed: ${response.status} ${err}`);
        }
    }
}
//# sourceMappingURL=airtable-api.js.map