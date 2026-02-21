/**
 * Google Cloud Storage client - lists and reads CSV files from a bucket.
 * Uses Application Default Credentials when running on Cloud Run.
 */
export interface CsvFile {
    name: string;
    content: string;
}
export default class GcsClient {
    private readonly storage;
    private readonly bucketName;
    constructor(bucketName?: string);
    listCsvFiles(): Promise<string[]>;
    readFileAsText(fileName: string): Promise<string>;
    getAllCsvFiles(): Promise<CsvFile[]>;
}
