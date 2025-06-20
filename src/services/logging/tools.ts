/**
 * Google Cloud Logging tools for MCP
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getProjectId } from '../../utils/auth.js';
import { GcpMcpError } from '../../utils/error.js';
import { formatLogEntry, getLoggingClient, LogEntry } from './types.js';
import { parseRelativeTime } from '../../utils/time.js';

/**
 * Registers Google Cloud Logging tools with the MCP server
 * 
 * @param server The MCP server instance
 */
export function registerLoggingTools(server: McpServer): void {
  // Tool to query logs with a custom filter
  server.tool(
    'query-logs',
    {
      filter: z.string().describe('The filter to apply to logs'),
      limit: z.number().min(1).max(1000).default(50).describe('Maximum number of log entries to return')
    },
    async ({ filter, limit }, _extra) => {
      try {
        const projectId = await getProjectId();
        const logging = getLoggingClient();
        
        const [entries] = await logging.getEntries({
          pageSize: limit,
          filter
        });

        if (!entries || entries.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No log entries found matching filter: ${filter}`
            }]
          };
        }

        const formattedLogs = entries
          .map((entry) => {
            try {
              return formatLogEntry(entry as unknown as LogEntry);
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              return `## Error Formatting Log Entry\n\nAn error occurred while formatting a log entry: ${errorMessage}`;
            }
          })
          .join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `# Log Query Results\n\nProject: ${projectId}\nFilter: ${filter}\nEntries: ${entries.length}\n\n${formattedLogs}`
          }]
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Return a user-friendly error message instead of throwing
        return {
          content: [{
            type: 'text',
            text: `# Error Querying Logs

An error occurred while querying logs: ${errorMessage}

Please check your filter syntax and try again. For filter syntax help, see: https://cloud.google.com/logging/docs/view/logging-query-language`
          }],
          isError: true
        };
      }
    }
  );

  // Tool to get logs for a specific time range
  server.tool(
    'logs-time-range',
    {
      startTime: z.string().describe('Start time in ISO format or relative time (e.g., "1h", "2d")'),
      endTime: z.string().optional().describe('End time in ISO format (defaults to now)'),
      filter: z.string().optional().describe('Additional filter criteria'),
      limit: z.number().min(1).max(1000).default(50).describe('Maximum number of log entries to return')
    },
    async ({ startTime, endTime, filter, limit }, _extra) => {
      try {
        const projectId = await getProjectId();
        const logging = getLoggingClient();
        
        const start = parseRelativeTime(startTime);
        const end = endTime ? parseRelativeTime(endTime) : new Date();
        
        // Build filter string
        let filterStr = `timestamp >= "${start.toISOString()}" AND timestamp <= "${end.toISOString()}"`;
        if (filter) {
          filterStr = `${filterStr} AND ${filter}`;
        }
        
        const [entries] = await logging.getEntries({
          pageSize: limit,
          filter: filterStr
        });

        if (!entries || entries.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No log entries found in the specified time range with filter: ${filterStr}`
            }]
          };
        }

        const formattedLogs = entries
          .map((entry) => {
            try {
              return formatLogEntry(entry as unknown as LogEntry);
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              return `## Error Formatting Log Entry\n\nAn error occurred while formatting a log entry: ${errorMessage}`;
            }
          })
          .join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `# Log Time Range Results\n\nProject: ${projectId}\nTime Range: ${start.toISOString()} to ${end.toISOString()}\nFilter: ${filter || 'None'}\nEntries: ${entries.length}\n\n${formattedLogs}`
          }]
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Return a user-friendly error message instead of throwing
        return {
          content: [{
            type: 'text',
            text: `# Error Querying Logs

An error occurred while querying logs: ${errorMessage}

Please check your time range format and try again. Valid formats include:
- ISO date strings (e.g., "2025-03-01T00:00:00Z")
- Relative time expressions: "1h" (1 hour ago), "2d" (2 days ago), "1w" (1 week ago), etc.`
          }],
          isError: true
        };
      }
    }
  );
}
