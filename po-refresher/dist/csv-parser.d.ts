/**
 * Parses CSV content into records with headers as keys.
 */
export interface ParsedRecord {
    [fieldName: string]: string | number | boolean;
}
/**
 * Parse CSV string into array of record objects.
 * First row = headers (field names). Empty values become empty string.
 */
export declare function parseCsvToRecords(csvContent: string): ParsedRecord[];
