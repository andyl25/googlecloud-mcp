/**
 * Prompts for Google Cloud MCP Server
 * 
 * This module defines reusable prompt templates for interacting with Google Cloud services.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * Register all prompts with the MCP server
 * 
 * @param server The MCP server instance
 */
export function registerPrompts(server: McpServer): void {
  // Log Analysis Prompts
  registerLogAnalysisPrompts(server);
  
  // Monitoring Prompts
  registerMonitoringPrompts(server);
  
  // Spanner Prompts
  registerSpannerPrompts(server);
}

/**
 * Register log analysis prompts
 * 
 * @param server The MCP server instance
 */
function registerLogAnalysisPrompts(server: McpServer): void {
  // Analyse errors in logs
  server.prompt(
    'analyse-errors',
    {
      timeframe: z.string().describe('Time range to analyse (e.g., "1h", "24h", "7d")'),
      severity: z.string().optional().describe('Minimum severity level (e.g., "ERROR", "WARNING")'),
      service: z.string().optional().describe('Filter by service name')
    },
    async (args, _extra) => {
      const { timeframe, severity, service } = args;
      const filter = [];
      
      if (severity) {
        filter.push(`severity>=${severity}`);
      }
      
      if (service) {
        filter.push(`resource.type="${service}"`);
      }
      
      const filterString = filter.length > 0 ? filter.join(' AND ') : '';
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyse the following logs from the past ${timeframe} and identify error patterns, their frequency, and potential root causes:`
            }
          },
          {
            role: 'user',
            content: {
              type: 'resource',
              resource: {
                uri: `logging://entries?timeframe=${timeframe}${filterString ? '&filter=' + encodeURIComponent(filterString) : ''}`,
                text: '',
                mimeType: 'text/plain'
              }
            }
          }
        ]
      };
    }
  );
  
  // Trace request through logs
  server.prompt(
    'trace-request',
    {
      traceId: z.string().describe('Trace ID to follow through logs'),
      timeframe: z.string().optional().describe('Time range to search (e.g., "1h", "24h")')
    },
    async (args, _extra) => {
      const { traceId, timeframe = '1h' } = args;
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Trace the following request through our services. Analyse the flow, identify any errors or performance issues, and summarise the request lifecycle:`
            }
          },
          {
            role: 'user',
            content: {
              type: 'resource',
              resource: {
                uri: `logging://entries?filter=${encodeURIComponent(`trace="${traceId}"`)}${timeframe ? '&timeframe=' + timeframe : ''}`,
                text: '',
                mimeType: 'text/plain'
              }
            }
          }
        ]
      };
    }
  );
}

/**
 * Register monitoring prompts
 * 
 * @param server The MCP server instance
 */
function registerMonitoringPrompts(server: McpServer): void {
  // Performance overview
  server.prompt(
    'performance-overview',
    {
      timeframe: z.string().describe('Time range to analyse (e.g., "1h", "24h", "7d")'),
      service: z.string().optional().describe('Filter by service name')
    },
    async (args, _extra) => {
      const { timeframe, service } = args;
      const filter = service ? `resource.type="${service}"` : '';
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Provide a performance overview for the past ${timeframe}. Analyse CPU usage, memory usage, and request latency. Identify any anomalies or performance issues:`
            }
          },
          {
            role: 'user',
            content: {
              type: 'resource',
              resource: {
                uri: `monitoring://timeseries?metric=compute.googleapis.com/instance/cpu/utilization&timeframe=${timeframe}${filter ? '&filter=' + encodeURIComponent(filter) : ''}`,
                text: '',
                mimeType: 'text/plain'
              }
            }
          },
          {
            role: 'user',
            content: {
              type: 'resource',
              resource: {
                uri: `monitoring://timeseries?metric=compute.googleapis.com/instance/memory/percent_used&timeframe=${timeframe}${filter ? '&filter=' + encodeURIComponent(filter) : ''}`,
                text: '',
                mimeType: 'text/plain'
              }
            }
          }
        ]
      };
    }
  );
  
  // Alert investigation
  server.prompt(
    'alert-investigation',
    {
      alertId: z.string().describe('Alert ID to investigate'),
      timeframe: z.string().optional().describe('Time window around alert (e.g., "30m", "1h")')
    },
    async (args, _extra) => {
      const { alertId, timeframe = '30m' } = args;
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Investigate alert ${alertId}. Analyse the metrics around the alert time, identify potential causes, and suggest remediation steps:`
            }
          },
          {
            role: 'user',
            content: {
              type: 'resource',
              resource: {
                uri: `monitoring://alert?id=${alertId}&timeframe=${timeframe}`,
                text: '',
                mimeType: 'text/plain'
              }
            }
          },
          {
            role: 'user',
            content: {
              type: 'resource',
              resource: {
                uri: `logging://entries?timeframe=${timeframe}&filter=${encodeURIComponent('severity>=WARNING')}`,
                text: '',
                mimeType: 'text/plain'
              }
            }
          }
        ]
      };
    }
  );
}

/**
 * Register Spanner prompts
 * 
 * @param server The MCP server instance
 */
function registerSpannerPrompts(server: McpServer): void {
  // Schema explanation
  server.prompt(
    'schema-explanation',
    {
      instanceId: z.string().describe('Spanner instance ID'),
      databaseId: z.string().describe('Spanner database ID')
    },
    async (args, _extra) => {
      const { instanceId, databaseId } = args;
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Explain the database schema for this Spanner database. Describe the tables, their relationships, primary and foreign keys, and the overall data model design:`
            }
          },
          {
            role: 'user',
            content: {
              type: 'resource',
              resource: {
                uri: `spanner://schema?instanceId=${instanceId}&databaseId=${databaseId}`,
                text: '',
                mimeType: 'text/plain'
              }
            }
          }
        ]
      };
    }
  );
  
  // Query optimization
  server.prompt(
    'query-optimization',
    {
      instanceId: z.string().describe('Spanner instance ID'),
      databaseId: z.string().describe('Spanner database ID'),
      query: z.string().describe('SQL query to optimize')
    },
    async (args, _extra) => {
      const { instanceId, databaseId, query } = args;
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyse and optimise this SQL query for Google Cloud Spanner. Consider performance, best practices, and potential improvements:\n\n\`\`\`sql\n${query}\n\`\`\``
            }
          },
          {
            role: 'user',
            content: {
              type: 'resource',
              resource: {
                uri: `spanner://schema?instanceId=${instanceId}&databaseId=${databaseId}`,
                text: '',
                mimeType: 'text/plain'
              }
            }
          }
        ]
      };
    }
  );
  
  // Data exploration
  server.prompt(
    'data-exploration',
    {
      instanceId: z.string().describe('Spanner instance ID'),
      databaseId: z.string().describe('Spanner database ID'),
      tableName: z.string().describe('Table to explore')
    },
    async (args, _extra) => {
      const { instanceId, databaseId, tableName } = args;
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Explore the data in the ${tableName} table. Analyse the sample data, identify patterns, data distributions, and provide insights about the data:`
            }
          },
          {
            role: 'user',
            content: {
              type: 'resource',
              resource: {
                uri: `spanner://table?instanceId=${instanceId}&databaseId=${databaseId}&tableName=${tableName}`,
                text: '',
                mimeType: 'text/plain'
              }
            }
          }
        ]
      };
    }
  );
}
