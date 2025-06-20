/**
 * Google Cloud Monitoring tools for MCP
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Registers Google Cloud Monitoring tools with the MCP server
 *
 * @param server The MCP server instance
 */
export declare function registerMonitoringTools(server: McpServer): Promise<void>;
