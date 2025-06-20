/**
 * Type definitions for Google Cloud Logging service
 */
import { Logging } from '@google-cloud/logging';
/**
 * Interface for Google Cloud Log Entry
 */
export interface LogEntry {
    timestamp: string;
    severity: string;
    resource: {
        type: string;
        labels: Record<string, string>;
    };
    logName: string;
    textPayload?: string;
    jsonPayload?: Record<string, unknown>;
    labels?: Record<string, string>;
    [key: string]: unknown;
}
/**
 * Initialises the Google Cloud Logging client
 *
 * @returns A configured Logging client
 */
export declare function getLoggingClient(): Logging;
/**
 * Formats a log entry for display
 *
 * @param entry The log entry to format
 * @returns A formatted string representation of the log entry
 */
export declare function formatLogEntry(entry: LogEntry): string;
