/**
 * Schema utilities for Google Cloud Spanner
 */
import { SpannerSchema } from './types.js';
/**
 * Extracts schema information from Spanner database
 *
 * @param instanceId Spanner instance ID
 * @param databaseId Spanner database ID
 * @returns Schema information for the database
 */
export declare function getSpannerSchema(instanceId: string, databaseId: string): Promise<SpannerSchema>;
/**
 * Formats schema information as markdown
 *
 * @param schema The schema to format
 * @returns A markdown string representation of the schema
 */
export declare function formatSchemaAsMarkdown(schema: SpannerSchema): string;
