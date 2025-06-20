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
export function getLoggingClient(): Logging {
  return new Logging({
    projectId: process.env.GOOGLE_CLOUD_PROJECT
  });
}

/**
 * Formats a log entry for display
 * 
 * @param entry The log entry to format
 * @returns A formatted string representation of the log entry
 */
export function formatLogEntry(entry: LogEntry): string {
  // Safely format the timestamp
  let timestamp: string;
  try {
    // Check if timestamp exists and is valid
    if (!entry.timestamp) {
      timestamp = 'No timestamp';
    } else {
      const date = new Date(entry.timestamp);
      timestamp = !isNaN(date.getTime()) ? date.toISOString() : String(entry.timestamp);
    }
  } catch (error) {
    timestamp = String(entry.timestamp || 'Invalid timestamp');
  }
  
  const severity = entry.severity || 'DEFAULT';
  const resourceType = entry.resource?.type || 'unknown';
  const resourceLabels = entry.resource?.labels 
    ? Object.entries(entry.resource.labels)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')
    : '';
  
  const resource = resourceLabels 
    ? `${resourceType}(${resourceLabels})` 
    : resourceType;
  
  // Format the payload with better error handling
  let payload: string;
  try {
    if (entry.textPayload !== undefined && entry.textPayload !== null) {
      payload = String(entry.textPayload);
    } else if (entry.jsonPayload) {
      payload = JSON.stringify(entry.jsonPayload, null, 2);
    } else if (entry.protoPayload) {
      payload = JSON.stringify(entry.protoPayload, null, 2);
    } else if (entry.data) {
      payload = JSON.stringify(entry.data, null, 2);
    } else {
      payload = '[No payload]';
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    payload = `[Error formatting payload: ${errorMessage}]`;
  }

  // Format labels if they exist
  let labelsStr = '';
  if (entry.labels && Object.keys(entry.labels).length > 0) {
    try {
      labelsStr = Object.entries(entry.labels)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      labelsStr = `[Error formatting labels: ${errorMessage}]`;
    }
  }

  // Format operation if it exists
  let operationStr = '';
  if (entry.operation) {
    try {
      const op = entry.operation as Record<string, any>;
      operationStr = [
        op.id ? `id=${op.id}` : '',
        op.producer ? `producer=${op.producer}` : '',
        op.first ? 'first=true' : '',
        op.last ? 'last=true' : ''
      ].filter(Boolean).join(', ');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      operationStr = `[Error formatting operation: ${errorMessage}]`;
    }
  }

  // Create a more detailed and markdown-friendly format
  return `## ${timestamp} | ${severity} | ${resource}
` +
    (entry.logName ? `**Log:** ${entry.logName}\n` : '') +
    (entry.insertId ? `**ID:** ${entry.insertId}\n` : '') +
    (labelsStr ? `**Labels:** ${labelsStr}\n` : '') +
    (operationStr ? `**Operation:** ${operationStr}\n` : '') +
    `\n\`\`\`\n${payload}\n\`\`\``;
}
