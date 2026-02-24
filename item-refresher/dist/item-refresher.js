import SquareAPI from './square-api.js';
import AirtableAPI from './airtable-api.js';
const ITEM_TABLE_NAME = 'Items';
/** Location names that map to Airtable columns (e.g. "Provo" -> "Enabled Provo", "Current Quantity Provo", etc.) */
const LOCATION_NAMES = (process.env.SQUARE_LOCATION_NAMES ?? 'Provo,American Fork')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
export default class ItemRefresher {
    async refreshItemTable() {
        const squareAPI = new SquareAPI();
        const airtableAPI = new AirtableAPI();
        const allItems = await squareAPI.getAllItems();
        await airtableAPI.deleteAllRecords(ITEM_TABLE_NAME);
        // TODO: Consider upserting by SKU+variationId to avoid rate limits and preserve linked fields/formulas
        const BATCH_SIZE = 10;
        for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
            const batch = allItems.slice(i, i + BATCH_SIZE);
            const records = batch.map(item => this._squareItemToAirtableRecord(item));
            await airtableAPI.addRecords(ITEM_TABLE_NAME, records);
        }
        return { recordsCreated: allItems.length };
    }
    _squareItemToAirtableRecord(item) {
        const fields = {
            SKU: item.sku,
            'Item Name': item.itemName,
            'Variation Name': item.variationName,
            Categories: item.categories,
            'Reporting Category': item.reportingCategory,
            GTIN: item.gtin,
            Price: item.priceAmount,
            Items: item.sku,
        };
        if (item.defaultUnitCost) {
            const cost = parseFloat(item.defaultUnitCost);
            if (!Number.isNaN(cost))
                fields['Default Unit Cost'] = cost;
        }
        if (item.defaultVendorName)
            fields['Default Vendor Name'] = item.defaultVendorName;
        if (item.defaultVendorCode)
            fields['Default Vendor Code'] = item.defaultVendorCode;
        for (const locName of LOCATION_NAMES) {
            const loc = item.locationData[locName];
            if (!loc)
                continue;
            fields[`Enabled ${locName}`] = !!loc.enabled;
            fields[`Current Quantity ${locName}`] = loc.quantity;
            fields[`Stock Alert Enabled ${locName}`] = !!loc.stockAlertEnabled;
            fields[`Stock Alert Count ${locName}`] = loc.stockAlertCount;
        }
        // Provo Restock Cost = quantity * unit cost (numeric for Airtable currency field)
        const provoQty = item.locationData['Provo']?.quantity ?? 0;
        const unitCost = parseFloat(item.defaultUnitCost) || 0;
        fields['Provo Restock Cost'] = provoQty * unitCost;
        return { fields };
    }
}
//# sourceMappingURL=item-refresher.js.map