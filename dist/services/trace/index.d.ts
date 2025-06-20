/**
 * Google Cloud Trace service for MCP
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Registers all Google Cloud Trace functionality with the MCP server
 *
 * @param server The MCP server instance
 */
export declare function registerTraceService(server: McpServer): Promise<void>;
export * from './types.js';
