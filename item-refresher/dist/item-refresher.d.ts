export default class ItemRefresher {
    refreshItemTable(): Promise<{
        recordsCreated: number;
    }>;
    private _squareItemToAirtableRecord;
}
