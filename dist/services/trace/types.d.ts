import { PluginTypes } from '@google-cloud/trace-agent';
/**
 * Trace span status
 */
export declare enum TraceStatus {
    OK = "OK",
    ERROR = "ERROR",
    UNSPECIFIED = "UNSPECIFIED"
}
/**
 * Trace span data
 */
export interface TraceSpan {
    /** Span ID */
    spanId: string;
    /** Display name */
    displayName: string;
    /** Start time */
    startTime: string;
    /** End time */
    endTime: string;
    /** Span kind */
    kind: string;
    /** Status */
    status: TraceStatus;
    /** Parent span ID (if any) */
    parentSpanId?: string;
    /** Attributes/labels */
    attributes: Record<string, string>;
    /** Child spans */
    childSpans?: TraceSpan[];
}
/**
 * Trace data
 */
export interface TraceData {
    /** Trace ID */
    traceId: string;
    /** Project ID */
    projectId: string;
    /** Root spans */
    rootSpans: TraceSpan[];
    /** All spans (flat list) */
    allSpans: TraceSpan[];
}
/**
 * Gets the Google Cloud Trace client
 *
 * @returns The trace client
 */
export declare function getTraceClient(): PluginTypes.Tracer;
/**
 * Formats trace data for display
 *
 * @param traceData The trace data to format
 * @returns Formatted markdown string
 */
export declare function formatTraceData(traceData: TraceData): string;
/**
 * Builds a hierarchical trace structure from flat spans
 *
 * @param projectId The Google Cloud project ID
 * @param traceId The trace ID
 * @param spans The flat list of spans
 * @returns Structured trace data
 */
export declare function buildTraceHierarchy(projectId: string, traceId: string, spans: any[]): TraceData;
/**
 * Extracts a trace ID from a log entry if present
 *
 * @param logEntry The log entry to check
 * @returns The trace ID if found, otherwise undefined
 */
export declare function extractTraceIdFromLog(logEntry: any): string | undefined;
