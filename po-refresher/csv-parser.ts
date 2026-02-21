/**
 * Parses CSV content into records with headers as keys.
 */

import { parse } from 'csv-parse/sync';

export interface ParsedRecord {
    [fieldName: string]: string | number | boolean;
}

/**
 * Parse CSV string into array of record objects.
 * First row = headers (field names). Empty values become empty string.
 */
export function parseCsvToRecords(csvContent: string): ParsedRecord[] {
    const rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        cast: (value, context) => {
            if (value === '' || value === null || value === undefined) return '';
            if (context.header) return value;
            const num = Number(value);
            if (!Number.isNaN(num) && String(num) === String(value).trim()) return num;
            if (value.toLowerCase() === 'true') return true;
            if (value.toLowerCase() === 'false') return false;
            return value;
        },
    }) as Record<string, unknown>[];

    return rows.map(row => {
        const out: ParsedRecord = {};
        for (const [k, v] of Object.entries(row)) {
            out[k] = v as string | number | boolean;
        }
        return out;
    });
}
