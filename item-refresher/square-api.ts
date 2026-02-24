/**
 * Square API - fetches catalog, inventory, and locations for Item Library export.
 * Catalog: GET /v2/catalog/list
 * Locations: GET /v2/locations
 * Inventory: POST /v2/inventory/counts/batch-retrieve
 */

const SQUARE_BASE_URL_PROD = 'https://connect.squareup.com/v2';
const SQUARE_BASE_URL_SANDBOX = 'https://connect.squareupsandbox.com/v2';
const SQUARE_BASE_URL = process.env.ENVIRONMENT === 'test' ? SQUARE_BASE_URL_SANDBOX : SQUARE_BASE_URL_PROD;
const SQUARE_API_VERSION = process.env.SQUARE_API_VERSION ?? '2026-01-22';

/** Location names to match (e.g. "Provo", "American Fork"). Set via SQUARE_LOCATION_NAMES env (comma-separated). */
const LOCATION_NAMES = (process.env.SQUARE_LOCATION_NAMES ?? 'Provo,American Fork')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

export default class SquareAPI {
    private readonly accessToken: string = process.env.SQUARE_ACCESS_TOKEN ?? '';

    private async _request<T>(pathOrUrl: string, options: RequestInit = {}): Promise<T> {
        const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${SQUARE_BASE_URL}${pathOrUrl}`;
        const res = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'Square-Version': SQUARE_API_VERSION,
                ...options.headers,
            },
        });
        const data = await res.json() as T & { errors?: Array<{ detail: string }> };
        if (data.errors?.length) {
            throw new Error(`Square API: ${data.errors.map((e: { detail: string }) => e.detail).join('; ')}`);
        }
        return data;
    }

    private async _fetchLocations(): Promise<Map<string, string>> {
        const data = await this._request<ListLocationsResponse>('/locations');
        const locations = data.locations ?? [];
        const nameToId = new Map<string, string>();
        for (const loc of locations) {
            const match = LOCATION_NAMES.find(n =>
                loc.name.toLowerCase().includes(n.toLowerCase())
            );
            if (match) nameToId.set(match, loc.id);
        }
        return nameToId;
    }

    private async _fetchInventoryCounts(
        variationIds: string[],
        locationIds: string[]
    ): Promise<Map<string, Map<string, number>>> {
        const result = new Map<string, Map<string, number>>();
        if (!variationIds.length || !locationIds.length) return result;

        const BATCH = 1000;
        for (let i = 0; i < variationIds.length; i += BATCH) {
            const chunk = variationIds.slice(i, i + BATCH);
            let cursor: string | undefined;

            do {
                const body: Record<string, unknown> = {
                    catalog_object_ids: chunk,
                    location_ids: locationIds,
                    states: ['IN_STOCK'],
                };
                if (cursor) body.cursor = cursor;

                const data = await this._request<BatchInventoryResponse>(
                    '/inventory/counts/batch-retrieve',
                    { method: 'POST', body: JSON.stringify(body) }
                );

                for (const c of data.counts ?? []) {
                    let byLoc = result.get(c.catalog_object_id);
                    if (!byLoc) {
                        byLoc = new Map();
                        result.set(c.catalog_object_id, byLoc);
                    }
                    byLoc.set(c.location_id, Number.parseFloat(c.quantity) || 0);
                }
                cursor = data.cursor;
            } while (cursor);
        }

        return result;
    }

    async getAllItems(): Promise<SquareItem[]> {
        const itemsById = new Map<string, CatalogObject>();
        const variationsByItemId = new Map<string, CatalogObject[]>();
        const categoriesById = new Map<string, string>();

        let cursor: string | undefined;
        const types = 'ITEM,ITEM_VARIATION,CATEGORY';

        do {
            const url = new URL('/catalog/list', SQUARE_BASE_URL);
            url.searchParams.set('types', types);
            if (cursor) url.searchParams.set('cursor', cursor);

            const data = await this._request<ListCatalogResponse>(url.pathname + url.search);

            const objects = data.objects ?? [];
            for (const obj of objects) {
                if (obj.type === 'ITEM' && obj.item_data) {
                    itemsById.set(obj.id, obj);
                } else if (obj.type === 'ITEM_VARIATION' && obj.item_variation_data) {
                    const itemId = obj.item_variation_data.item_id;
                    const list = variationsByItemId.get(itemId) ?? [];
                    list.push(obj);
                    variationsByItemId.set(itemId, list);
                } else if (obj.type === 'CATEGORY' && obj.category_data) {
                    categoriesById.set(obj.id, obj.category_data.name);
                }
            }
            cursor = data.cursor;
        } while (cursor);

        const locationNameToId = await this._fetchLocations();
        const locationIds = [...locationNameToId.values()];
        const allVariationIds = [...variationsByItemId.values()].flat().map(v => v.id);
        let inventoryByVariation = new Map<string, Map<string, number>>();
        try {
            inventoryByVariation = await this._fetchInventoryCounts(allVariationIds, locationIds);
        } catch (e) {
            console.warn('Inventory API unavailable (check INVENTORY_READ permission):', (e as Error).message);
        }

        const result: SquareItem[] = [];

        for (const [itemId, itemObj] of itemsById) {
            const itemData = itemObj.item_data!;
            const variations = variationsByItemId.get(itemId) ?? [];
            const categoryPath = this._buildCategoryPath(itemData.categories, categoriesById);
            const reportingCategory = itemData.reporting_category?.id
                ? categoriesById.get(itemData.reporting_category.id) ?? ''
                : '';

            for (const varObj of variations) {
                const varData = varObj.item_variation_data!;
                const amount = varData.price_money?.amount ?? 0;
                const priceAmount = amount / 100;
                const priceStr = amount > 0 ? `$${priceAmount.toFixed(2)}` : '';

                const locationData: SquareItem['locationData'] = {};
                for (const locName of LOCATION_NAMES) {
                    const locId = locationNameToId.get(locName);
                    if (!locId) continue;

                    const override = varData.location_overrides?.find(o => o.location_id === locId);
                    const trackInv = override?.track_inventory ?? varData.track_inventory ?? false;
                    const alertType = override?.inventory_alert_type ?? varData.inventory_alert_type;
                    const alertThreshold = override?.inventory_alert_threshold ?? varData.inventory_alert_threshold ?? 0;

                    const counts = inventoryByVariation.get(varObj.id);
                    const quantity = counts?.get(locId) ?? 0;

                    locationData[locName] = {
                        enabled: trackInv,
                        quantity,
                        stockAlertEnabled: alertType === 'LOW_QUANTITY',
                        stockAlertCount: alertThreshold ?? 0,
                    };
                }

                result.push({
                    sku: varData.sku ?? '',
                    itemName: itemData.name ?? '',
                    variationName: varData.name ?? '',
                    categories: categoryPath,
                    reportingCategory,
                    gtin: varData.upc ?? '',
                    price: priceStr,
                    priceAmount,
                    defaultUnitCost: '',
                    defaultVendorName: '',
                    defaultVendorCode: '',
                    itemId,
                    variationId: varObj.id,
                    locationData,
                });
            }
        }

        return result;
    }

    private _buildCategoryPath(
        categories: Array<{ id: string }> | undefined,
        categoriesById: Map<string, string>
    ): string {
        if (!categories?.length) return '';
        return categories
            .map(c => categoriesById.get(c.id) ?? '')
            .filter(Boolean)
            .join(',');
    }
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

interface LocationOverride {
    location_id: string;
    track_inventory?: boolean;
    inventory_alert_type?: string;
    inventory_alert_threshold?: number;
}

interface CatalogObject {
    type: string;
    id: string;
    item_data?: {
        name: string;
        categories?: Array<{ id: string }>;
        reporting_category?: { id: string };
    };
    item_variation_data?: {
        item_id: string;
        name: string;
        sku?: string;
        upc?: string;
        price_money?: { amount: number; currency: string };
        track_inventory?: boolean;
        inventory_alert_type?: string;
        inventory_alert_threshold?: number;
        location_overrides?: LocationOverride[];
    };
    category_data?: {
        name: string;
        parent_category?: { id: string };
        path_to_root?: Array<{ category?: { id: string } }>;
    };
}

interface ListCatalogResponse {
    objects?: CatalogObject[];
    cursor?: string;
    errors?: Array<{ code: string; detail: string }>;
}

interface Location {
    id: string;
    name: string;
}

interface ListLocationsResponse {
    locations?: Location[];
    errors?: Array<{ code: string; detail: string }>;
}

interface InventoryCount {
    catalog_object_id: string;
    location_id: string;
    quantity: string;
    state?: string;
}

interface BatchInventoryResponse {
    counts?: InventoryCount[];
    cursor?: string;
    errors?: Array<{ code: string; detail: string }>;
}