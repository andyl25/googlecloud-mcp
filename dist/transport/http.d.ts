import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
/**
 * HTTP Transport implementation for MCP Server using Streamable HTTP
 */
export declare class HttpTransport implements Transport {
    private app;
    private sessions;
    private sseConnections;
    private pendingRequests;
    private port;
    private httpServer?;
    private eventIdCounter;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage) => void;
    constructor(port?: number);
    /**
     * Setup Express middleware
     */
    private setupMiddleware;
    /**
     * Validate origin header to prevent DNS rebinding attacks
     */
    private isValidOrigin;
    /**
     * Setup Express routes
     */
    private setupRoutes;
    /**
     * Handle POST requests to /mcp endpoint
     */
    private handleMcpPost;
    /**
     * Handle GET requests to /mcp endpoint (for server-initiated SSE streams)
     */
    private handleMcpGet;
    /**
     * Handle DELETE requests to /mcp endpoint (session termination)
     */
    private handleMcpDelete;
    /**
     * Setup SSE connection management
     */
    private setupSSEConnection;
    /**
     * Send SSE message
     */
    private sendSSEMessage;
    /**
     * Check if message is an initialize request
     */
    private isInitializeRequest;
    /**
     * Determine if response should be streamed
     */
    private shouldStream;
    /**
     * Start the HTTP server
     */
    start(): Promise<void>;
    /**
     * Send a message (implements Transport interface)
     */
    send(message: JSONRPCMessage): Promise<void>;
    /**
     * Close the transport
     */
    close(): Promise<void>;
}
