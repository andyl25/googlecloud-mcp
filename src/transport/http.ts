/**
 * HTTP Transport for MCP Server
 * 
 * Implements the Streamable HTTP transport as defined in the MCP specification:
 * https://modelcontextprotocol.io/docs/concepts/transports#streamable-http
 */
import express, { Request, Response, NextFunction } from 'express';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage, JSONRPCRequest, JSONRPCResponse } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'node:http';

interface SessionData {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  data?: any;
}

interface SSEConnection {
  sessionId: string;
  response: Response;
  keepAlive: NodeJS.Timeout;
  lastEventId: number;
}

interface PendingRequest {
  id: string | number;
  resolve: (response: JSONRPCResponse) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

/**
 * HTTP Transport implementation for MCP Server using Streamable HTTP
 */
export class HttpTransport implements Transport {
  private app: express.Application;
  private sessions: Map<string, SessionData> = new Map();
  private sseConnections: Map<string, SSEConnection> = new Map();
  private pendingRequests: Map<string | number, PendingRequest> = new Map();
  private port: number;
  private httpServer?: any;
  private eventIdCounter = 0;

  // Transport interface callbacks
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json());
    
    // CORS middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id, Last-Event-ID, Accept');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      
      next();
    });

    // Security middleware - validate Origin header to prevent DNS rebinding attacks
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      if (origin && !this.isValidOrigin(origin)) {
        res.status(403).json({ error: 'Forbidden origin' });
        return;
      }
      next();
    });
  }

  /**
   * Validate origin header to prevent DNS rebinding attacks
   */
  private isValidOrigin(origin: string): boolean {
    try {
      const url = new URL(origin);
      // Allow localhost and 127.0.0.1
      return url.hostname === 'localhost' || 
             url.hostname === '127.0.0.1' || 
             url.hostname.endsWith('.local');
    } catch {
      return false;
    }
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    // Main MCP endpoint - handles both POST and GET
    this.app.post('/mcp', this.handleMcpPost.bind(this));
    this.app.get('/mcp', this.handleMcpGet.bind(this));
    this.app.delete('/mcp', this.handleMcpDelete.bind(this));
    
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  /**
   * Handle POST requests to /mcp endpoint
   */
  private async handleMcpPost(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.headers['mcp-session-id'] as string;
      const acceptHeader = req.headers.accept || 'application/json';
      
      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Parse error' },
          id: null
        });
        return;
      }

      const jsonrpcMessage = req.body as JSONRPCMessage;
      
      // Handle session management
      if (this.isInitializeRequest(jsonrpcMessage)) {
        const newSessionId = randomUUID();
        this.sessions.set(newSessionId, {
          id: newSessionId,
          createdAt: new Date(),
          lastActivity: new Date()
        });
        res.setHeader('Mcp-Session-Id', newSessionId);
      } else if (sessionId) {
        // Update session activity
        const session = this.sessions.get(sessionId);
        if (session) {
          session.lastActivity = new Date();
        }
      }

      // Handle the request
      if ('id' in jsonrpcMessage && jsonrpcMessage.id !== undefined) {
        // This is a request, wait for response
        const requestId = jsonrpcMessage.id;
        
        // Create promise to wait for response
        const responsePromise = new Promise<JSONRPCResponse>((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.pendingRequests.delete(requestId);
            reject(new Error('Request timeout'));
          }, 30000);

          this.pendingRequests.set(requestId, {
            id: requestId,
            resolve,
            reject,
            timeout
          });
        });

        // Forward the message to the MCP server
        if (this.onmessage) {
          this.onmessage(jsonrpcMessage);
        }

        try {
          const response = await responsePromise;
          
          // Determine if we need streaming based on Accept header
          const needsStreaming = acceptHeader.includes('text/event-stream');
          
          if (needsStreaming && this.shouldStream(response)) {
            // Send SSE stream
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            
            this.sendSSEMessage(res, response);
            
            // Keep connection alive if needed
            if (sessionId) {
              this.setupSSEConnection(sessionId, res);
            } else {
              res.end();
            }
          } else {
            // Send single JSON response
            res.json(response);
          }
        } catch (error) {
          throw error;
        }
      } else {
        // This is a notification, no response expected
        if (this.onmessage) {
          this.onmessage(jsonrpcMessage);
        }
        res.status(200).json({ status: 'ok' });
      }
    } catch (error) {
      const errorResponse = {
        jsonrpc: '2.0' as const,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error)
        },
        id: null
      };
      
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Handle GET requests to /mcp endpoint (for server-initiated SSE streams)
   */
  private handleMcpGet(req: Request, res: Response): void {
    const sessionId = req.headers['mcp-session-id'] as string;
    const lastEventId = req.headers['last-event-id'] as string;
    
    if (!sessionId || !this.sessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }

    // Setup SSE stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // If client is resuming, we could replay messages here
    if (lastEventId) {
      // Implementation for message replay would go here
      // For now, we'll just acknowledge the resume
      this.sendSSEMessage(res, { 
        type: 'resume', 
        lastEventId 
      }, 'resume');
    }
    
    this.setupSSEConnection(sessionId, res);
  }

  /**
   * Handle DELETE requests to /mcp endpoint (session termination)
   */
  private handleMcpDelete(req: Request, res: Response): void {
    const sessionId = req.headers['mcp-session-id'] as string;
    
    if (sessionId) {
      this.sessions.delete(sessionId);
      
      // Close any SSE connections for this session
      const sseConn = this.sseConnections.get(sessionId);
      if (sseConn) {
        clearInterval(sseConn.keepAlive);
        sseConn.response.end();
        this.sseConnections.delete(sessionId);
      }
    }
    
    res.sendStatus(200);
  }

  /**
   * Setup SSE connection management
   */
  private setupSSEConnection(sessionId: string, res: Response): void {
    // Clean up any existing connection
    const existingConn = this.sseConnections.get(sessionId);
    if (existingConn) {
      clearInterval(existingConn.keepAlive);
    }
    
    // Setup keep-alive
    const keepAlive = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch (error: unknown) {
        // Connection closed
        clearInterval(keepAlive);
        this.sseConnections.delete(sessionId);
      }
    }, 30000);
    
    // Store connection
    this.sseConnections.set(sessionId, {
      sessionId,
      response: res,
      keepAlive,
      lastEventId: this.eventIdCounter
    });
    
    // Handle connection close
    res.on('close', () => {
      clearInterval(keepAlive);
      this.sseConnections.delete(sessionId);
    });
  }

  /**
   * Send SSE message
   */
  private sendSSEMessage(res: Response, data: any, eventType: string = 'message', id?: string): void {
    if (eventType !== 'keep-alive') {
      res.write(`event: ${eventType}\n`);
    }
    
    const eventId = id || String(++this.eventIdCounter);
    res.write(`id: ${eventId}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /**
   * Check if message is an initialize request
   */
  private isInitializeRequest(message: JSONRPCMessage): boolean {
    return 'method' in message && message.method === 'initialize';
  }

  /**
   * Determine if response should be streamed
   */
  private shouldStream(response: any): boolean {
    // Implement logic to determine if response should be streamed
    // For now, we'll stream for certain types of responses
    return false; // Default to no streaming
  }

  // Transport interface methods
  
  /**
   * Start the HTTP server
   */
  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer = this.app.listen(this.port, '127.0.0.1', () => {
          console.error(`[INFO] HTTP transport listening on http://127.0.0.1:${this.port}/mcp`);
          resolve();
        });
        
        this.httpServer.on('error', (error: Error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a message (implements Transport interface)
   */
  public async send(message: JSONRPCMessage): Promise<void> {
    // If this is a response to a pending request, resolve the promise
    if ('id' in message && message.id !== undefined) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);
        pending.resolve(message as JSONRPCResponse);
        return;
      }
    }
    
    // For server-initiated messages, send to all active SSE connections
    for (const [sessionId, conn] of this.sseConnections) {
      try {
        this.sendSSEMessage(conn.response, message, 'message');
      } catch (error) {
        // Connection may have been closed
        this.sseConnections.delete(sessionId);
      }
    }
  }

  /**
   * Close the transport
   */
  public async close(): Promise<void> {
    // Clear all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Transport closed'));
    }
    this.pendingRequests.clear();
    
    // Close all SSE connections
    for (const [sessionId, conn] of this.sseConnections) {
      clearInterval(conn.keepAlive);
      conn.response.end();
    }
    this.sseConnections.clear();
    
    // Clear sessions
    this.sessions.clear();
    
    // Close HTTP server
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer.close(() => {
          resolve();
        });
      });
    }
    
    // Call onclose callback
    if (this.onclose) {
      this.onclose();
    }
  }
} 