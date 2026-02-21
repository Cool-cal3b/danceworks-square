/**
 * Square API - fetches catalog, inventory, and locations for Item Library export.
 * Catalog: GET /v2/catalog/list
 * Locations: GET /v2/locations
 * Inventory: POST /v2/inventory/counts/batch-retrieve
 */
export default class SquareAPI {
    private readonly accessToken;
    private _request;
    private _fetchLocations;
    private _fetchInventoryCounts;
    getAllItems(): Promise<SquareItem[]>;
    private _buildCategoryPath;
}
export interface SquareItem {
    sku: string;
    itemName: string;
    variationName: string;
    categories: string;
    reportingCategory: string;
    gtin: string;
    price: string;
    /** Numeric price for Airtable (e.g. 49.00) */
    priceAmount: number;
    defaultUnitCost: string;
    defaultVendorName: string;
    defaultVendorCode: string;
    itemId: string;
    variationId: string;
    /** Per-location: enabled (track_inventory), quantity, stock alert enabled, stock alert count */
    locationData: Record<string, {
        enabled: boolean;
        quantity: number;
        stockAlertEnabled: boolean;
        stockAlertCount: number;
    }>;
}
