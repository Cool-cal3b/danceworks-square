import ItemRefresher from './item-refresher';

async function refreshItemTable() {
    // Export Square catalog items into Airtable "Items" table
    // Deletes existing rows and re-imports from Square
    const itemRefresher = new ItemRefresher();
    await itemRefresher.refreshItemTable();
}

refreshItemTable();