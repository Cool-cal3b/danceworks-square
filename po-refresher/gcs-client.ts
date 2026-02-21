/**
 * Google Cloud Storage client - lists and reads CSV files from a bucket.
 * Uses Application Default Credentials when running on Cloud Run.
 */

import { Storage } from '@google-cloud/storage';

export interface CsvFile {
    name: string;
    content: string;
}

export default class GcsClient {
    private readonly storage: Storage;
    private readonly bucketName: string;

    constructor(bucketName?: string) {
        this.storage = new Storage();
        this.bucketName = bucketName ?? process.env.GCS_BUCKET_NAME ?? '';
        if (!this.bucketName) {
            throw new Error('GCS_BUCKET_NAME env var is required');
        }
    }

    async listCsvFiles(): Promise<string[]> {
        const [files] = await this.storage.bucket(this.bucketName).getFiles();
        return files
            .filter(f => f.name.toLowerCase().endsWith('.csv'))
            .map(f => f.name);
    }

    async readFileAsText(fileName: string): Promise<string> {
        const [content] = await this.storage
            .bucket(this.bucketName)
            .file(fileName)
            .download();
        return content.toString('utf-8');
    }

    async getAllCsvFiles(): Promise<CsvFile[]> {
        const fileNames = await this.listCsvFiles();
        const results: CsvFile[] = [];
        for (const name of fileNames) {
            const content = await this.readFileAsText(name);
            results.push({ name, content });
        }
        return results;
    }
}
