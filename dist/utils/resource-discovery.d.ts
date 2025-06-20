/**
 * Resource discovery utilities for MCP server
 *
 * This module provides functions to register resource discovery endpoints
 * that allow clients to list available resources.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Register resource discovery handlers with the MCP server
 *
 * @param server The MCP server instance
 */
export declare function registerResourceDiscovery(server: McpServer): Promise<void>;
