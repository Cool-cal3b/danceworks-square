/**
 * Google Cloud Storage client - lists and reads CSV files from a bucket.
 * Uses Application Default Credentials when running on Cloud Run.
 */
import { Storage } from '@google-cloud/storage';
export default class GcsClient {
    storage;
    bucketName;
    constructor(bucketName) {
        this.storage = new Storage();
        this.bucketName = bucketName ?? process.env.GCS_BUCKET_NAME ?? '';
        if (!this.bucketName) {
            throw new Error('GCS_BUCKET_NAME env var is required');
        }
    }
    async listCsvFiles() {
        const [files] = await this.storage.bucket(this.bucketName).getFiles();
        return files
            .filter(f => f.name.toLowerCase().endsWith('.csv'))
            .map(f => f.name);
    }
    async readFileAsText(fileName) {
        const [content] = await this.storage
            .bucket(this.bucketName)
            .file(fileName)
            .download();
        return content.toString('utf-8');
    }
    async getAllCsvFiles() {
        const fileNames = await this.listCsvFiles();
        const results = [];
        for (const name of fileNames) {
            const content = await this.readFileAsText(name);
            results.push({ name, content });
        }
        return results;
    }
}
//# sourceMappingURL=gcs-client.js.map