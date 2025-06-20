/**
 * Project management tools for Google Cloud MCP
 * 
 * This module provides tools for managing Google Cloud project settings
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getProjectId, setProjectId, getRecentProjectIds } from './auth.js';
import { stateManager } from './state-manager.js';

/**
 * Registers project management tools with the MCP server
 * 
 * @param server The MCP server instance
 */
export function registerProjectTools(server: McpServer): void {
  // Tool to set the default project ID
  server.tool(
    'set-project-id',
    {
      projectId: z.string().describe('The Google Cloud project ID to set as default')
    },
    async ({ projectId }, context) => {
      try {
        await setProjectId(projectId);
        
        return {
          content: [{
            type: 'text',
            text: `# Project ID Updated\n\nDefault Google Cloud project ID has been set to: \`${projectId}\`\n\nThis project ID will be used for all Google Cloud operations until changed.`
          }]
        };
      } catch (error: any) {
        // Error handling for set-project-id tool
        return {
          content: [{
            type: 'text',
            text: `# Error Setting Project ID\n\nFailed to set project ID: ${error.message}`
          }]
        };
      }
    }
  );
  
  // Tool to get the current project ID
  server.tool(
    'get-project-id',
    {},
    async (_, context) => {
      try {
        // Get the current project ID from the state manager first
        let projectId = stateManager.getCurrentProjectId();
        
        // If not available in state manager, try to get it from auth
        if (!projectId) {
          projectId = await getProjectId();
        }
        
        const recentProjectIds = await getRecentProjectIds();
        
        let markdown = `# Current Google Cloud Project\n\nCurrent project ID: \`${projectId}\`\n\n`;
        
        if (recentProjectIds.length > 0) {
          markdown += '## Recently Used Projects\n\n';
          for (const id of recentProjectIds) {
            markdown += `- \`${id}\`${id === projectId ? ' (current)' : ''}\n`;
          }
        }
        
        return {
          content: [{
            type: 'text',
            text: markdown
          }]
        };
      } catch (error: any) {
        console.error('Error in get-project-id tool:', error);
        return {
          content: [{
            type: 'text',
            text: `# Error Getting Project ID\n\nFailed to get project ID: ${error.message}`
          }]
        };
      }
    }
  );
}
