/**
 * Google Cloud MCP Server
 *
 * This server provides Model Context Protocol resources and tools for interacting
 * with Google Cloud services (Logging, Spanner, and Monitoring).
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { HttpTransport } from './transport/http.js';
import dotenv from 'dotenv';
// Import service modules
import { registerLoggingResources, registerLoggingTools } from './services/logging/index.js';
import { registerSpannerResources, registerSpannerTools, registerSpannerQueryCountTool } from './services/spanner/index.js';
import { registerMonitoringResources, registerMonitoringTools } from './services/monitoring/index.js';
import { registerTraceService } from './services/trace/index.js';
import { registerPrompts } from './prompts/index.js';
import { initGoogleAuth, authClient } from './utils/auth.js';
import { registerResourceDiscovery } from './utils/resource-discovery.js';
import { registerProjectTools } from './utils/project-tools.js';
// Load environment variables
dotenv.config();
// Transport configuration
const TRANSPORT_TYPE = process.env.MCP_TRANSPORT || 'stdio'; // 'stdio' or 'http'
const HTTP_PORT = parseInt(process.env.MCP_HTTP_PORT || '3000');
/**
 * Custom logger that writes to stderr (won't interfere with stdio protocol)
 */
const logger = {
    debug: (message, ...args) => {
        if (process.env.DEBUG) {
            console.error(`[DEBUG] ${message}`, ...args);
        }
    },
    info: (message, ...args) => {
        console.error(`[INFO] ${message}`, ...args);
    },
    warn: (message, ...args) => {
        console.error(`[WARN] ${message}`, ...args);
    },
    error: (message, ...args) => {
        console.error(`[ERROR] ${message}`, ...args);
    }
};
/**
 * Main function to start the MCP server
 */
async function main() {
    // Set up unhandled error handlers to prevent silent crashes
    process.on('uncaughtException', (error) => {
        logger.error(`Uncaught exception: ${error.message}`, error.stack);
        // Don't exit, just log the error
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger.error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
        // Don't exit, just log the error
    });
    // Add signal handlers to ensure clean shutdown
    process.on('SIGINT', () => {
        logger.info('Received SIGINT signal, shutting down gracefully');
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        logger.info('Received SIGTERM signal, shutting down gracefully');
        process.exit(0);
    });
    // Debug environment variables
    if (process.env.DEBUG) {
        logger.debug('Environment variables:');
        logger.debug(`GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'not set'}`);
        logger.debug(`GOOGLE_CLOUD_PROJECT: ${process.env.GOOGLE_CLOUD_PROJECT || 'not set'}`);
        logger.debug(`GOOGLE_CLIENT_EMAIL: ${process.env.GOOGLE_CLIENT_EMAIL ? 'set' : 'not set'}`);
        logger.debug(`GOOGLE_PRIVATE_KEY: ${process.env.GOOGLE_PRIVATE_KEY ? 'set' : 'not set'}`);
        logger.debug(`LAZY_AUTH: ${process.env.LAZY_AUTH || 'not set'}`);
        logger.debug(`DEBUG: ${process.env.DEBUG || 'not set'}`);
        logger.debug(`MCP_TRANSPORT: ${TRANSPORT_TYPE}`);
        logger.debug(`MCP_HTTP_PORT: ${HTTP_PORT}`);
    }
    try {
        logger.info('Starting Google Cloud MCP server...');
        // Create the MCP server first to ensure it's ready to handle requests
        // even if authentication is still initializing
        logger.info('Creating MCP server instance');
        const server = new McpServer({
            name: 'Google Cloud MCP',
            version: '0.1.0',
            description: 'Model Context Protocol server for Google Cloud services'
        }, {
            capabilities: {
                prompts: {},
                resources: {},
                tools: {}
            }
        });
        // Initialize Google Cloud authentication in non-blocking mode
        // This allows the server to start even if credentials aren't available yet
        const lazyAuth = process.env.LAZY_AUTH !== 'false'; // Default to true if not set
        logger.info(`Initializing Google Cloud authentication in lazy loading mode: ${lazyAuth}`);
        // If LAZY_AUTH is true (default), we'll defer authentication until it's actually needed
        // This helps with Smithery which may time out during auth initialization
        const authPromise = lazyAuth ?
            Promise.resolve(null) :
            initGoogleAuth(false).then(auth => {
                if (auth) {
                    logger.info('Google Cloud authentication initialized successfully');
                }
                else {
                    logger.warn('Google Cloud authentication not available - will attempt lazy loading when needed');
                }
                return auth;
            }).catch((err) => {
                logger.warn(`Auth initialization warning: ${err.message}`);
                return null;
            });
        // Register resources and tools for each Google Cloud service
        // These operations should not block server startup
        try {
            logger.info('Registering Google Cloud Logging services');
            registerLoggingResources(server);
            registerLoggingTools(server);
        }
        catch (error) {
            logger.warn(`Error registering Logging services: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
            logger.info('Registering Google Cloud Spanner services');
            registerSpannerResources(server);
            registerSpannerTools(server);
            registerSpannerQueryCountTool(server);
        }
        catch (error) {
            logger.warn(`Error registering Spanner services: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
            logger.info('Registering Google Cloud Monitoring services');
            registerMonitoringResources(server);
            await registerMonitoringTools(server);
        }
        catch (error) {
            logger.warn(`Error registering Monitoring services: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
            // Register Google Cloud Trace service
            logger.info('Registering Google Cloud Trace services');
            await registerTraceService(server);
        }
        catch (error) {
            logger.warn(`Error registering Trace services: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
            // Register additional tools
            logger.info('Registering additional tools');
            registerProjectTools(server);
        }
        catch (error) {
            logger.warn(`Error registering project tools: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
            // Register prompts
            logger.info('Registering prompts');
            registerPrompts(server);
        }
        catch (error) {
            logger.warn(`Error registering prompts: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
            // Register resource discovery endpoints
            logger.info('Registering resource discovery');
            await registerResourceDiscovery(server);
        }
        catch (error) {
            logger.warn(`Error registering resource discovery: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Setup transport based on configuration
        logger.info(`Starting ${TRANSPORT_TYPE} transport`);
        if (TRANSPORT_TYPE === 'http') {
            // Use HTTP transport
            const transport = new HttpTransport(HTTP_PORT);
            // Connect the server to the transport
            logger.info('Connecting server to HTTP transport');
            await server.connect(transport);
            logger.info(`HTTP transport server started successfully on port ${HTTP_PORT}`);
            logger.info(`MCP endpoint available at: http://127.0.0.1:${HTTP_PORT}/mcp`);
            // Keep the process alive and periodically check auth status
            let heartbeatCount = 0;
            setInterval(() => {
                // Heartbeat to keep the process alive
                heartbeatCount++;
                if (process.env.DEBUG) {
                    logger.debug(`Server heartbeat #${heartbeatCount}`);
                }
                // Check auth status periodically, but not on every heartbeat to reduce load
                // Only check auth every 5 heartbeats (approximately every 2.5 minutes)
                if (!authClient && heartbeatCount % 5 === 0) {
                    logger.debug('Attempting delayed authentication check');
                    initGoogleAuth(false).then(auth => {
                        if (auth && !authClient) {
                            logger.info('Google Cloud authentication initialized successfully (delayed)');
                        }
                    }).catch((authError) => {
                        // Log but don't crash on auth errors
                        logger.debug(`Delayed auth check failed: ${authError instanceof Error ? authError.message : String(authError)}`);
                    });
                }
            }, 30000);
        }
        else {
            // Use stdio transport (default)
            const transport = new StdioServerTransport();
            // Connect the server to the transport
            logger.info('Connecting server to stdio transport');
            await server.connect(transport);
            logger.info('Stdio transport server started successfully and ready to handle requests');
            // Keep the process alive and periodically check auth status
            let heartbeatCount = 0;
            setInterval(() => {
                // Heartbeat to keep the process alive
                heartbeatCount++;
                if (process.env.DEBUG) {
                    logger.debug(`Server heartbeat #${heartbeatCount}`);
                }
                // Check auth status periodically, but not on every heartbeat to reduce load
                // Only check auth every 5 heartbeats (approximately every 2.5 minutes)
                if (!authClient && heartbeatCount % 5 === 0) {
                    logger.debug('Attempting delayed authentication check');
                    initGoogleAuth(false).then(auth => {
                        if (auth && !authClient) {
                            logger.info('Google Cloud authentication initialized successfully (delayed)');
                        }
                    }).catch((authError) => {
                        // Log but don't crash on auth errors
                        logger.debug(`Delayed auth check failed: ${authError instanceof Error ? authError.message : String(authError)}`);
                    });
                }
            }, 30000);
        }
    }
    catch (error) {
        // Log the error to stderr (won't interfere with stdio protocol)
        logger.error(`Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`);
        logger.error(error instanceof Error ? error.stack || 'No stack trace available' : 'No stack trace available');
        // Don't exit immediately, give time for logs to be seen
        // But also don't exit at all - let the server continue running even with errors
        // This is important for Smithery which expects the server to stay alive
        logger.info('Server continuing to run despite startup errors');
    }
}
// Start the server
main();
//# sourceMappingURL=index.js.map