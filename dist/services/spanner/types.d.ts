/**
 * Type definitions for Google Cloud Spanner service
 */
import { Spanner } from '@google-cloud/spanner';
export interface SpannerSchema {
    tables: SpannerTable[];
}
export interface SpannerTable {
    name: string;
    columns: SpannerColumn[];
    indexes?: SpannerIndex[];
    foreignKeys?: SpannerForeignKey[];
}
export interface SpannerForeignKey {
    name: string;
    columns: string[];
    referencedTable: string;
    referencedColumns: string[];
}
export interface SpannerColumn {
    name: string;
    type: string;
    nullable?: boolean;
}
export interface SpannerIndex {
    name: string;
    columns: string[];
    unique?: boolean;
}
/**
 * Initialises the Google Cloud Spanner client
 *
 * @returns A configured Spanner client
 */
export declare function getSpannerClient(): Promise<Spanner>;
/**
 * Gets the Spanner instance and database from environment variables or parameters
 *
 * @param instanceId Optional instance ID (defaults to environment variable)
 * @param databaseId Optional database ID (defaults to environment variable)
 * @returns The instance and database IDs
 */
export declare function getSpannerConfig(instanceId?: string, databaseId?: string): Promise<{
    instanceId: string;
    databaseId: string;
}>;
