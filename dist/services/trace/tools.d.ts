/**
 * Google Cloud Trace tools for MCP
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Registers Google Cloud Trace tools with the MCP server
 *
 * @param server The MCP server instance
 */
export declare function registerTraceTools(server: McpServer): Promise<void>;
