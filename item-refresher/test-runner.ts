#!/usr/bin/env node
/**
 * Local test runner - bypasses HTTP and calls ItemRefresher directly.
 * Uses env vars from .env.test
 */

import ItemRefresher from './item-refresher.js';

async function test() {
    console.log('🚀 Starting item refresh test...\n');
    console.log('Environment:');
    console.log(`  SQUARE_ACCESS_TOKEN: ${process.env.SQUARE_ACCESS_TOKEN ? '***set***' : '❌ MISSING'}`);
    console.log(`  AIRTABLE_API_KEY: ${process.env.AIRTABLE_API_KEY ? '***set***' : '❌ MISSING'}`);
    console.log(`  AIRTABLE_BASE_ID: ${process.env.AIRTABLE_BASE_ID ? '***set***' : '❌ MISSING'}`);
    console.log(`  SQUARE_LOCATION_NAMES: ${process.env.SQUARE_LOCATION_NAMES || '(default)'}`);
    console.log('');

    try {
        const refresher = new ItemRefresher();
        const result = await refresher.refreshItemTable();
        console.log('✅ Success!');
        console.log(`   Records created: ${result.recordsCreated}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err instanceof Error ? err.message : String(err));
        if (err instanceof Error && err.stack) {
            console.error(err.stack);
        }
        process.exit(1);
    }
}

test();
