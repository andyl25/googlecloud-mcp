/**
 * Error handling utilities
 */
/**
 * Custom error class for Google Cloud MCP server errors
 */
export declare class GcpMcpError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: unknown;
    constructor(message: string, code?: string, statusCode?: number, details?: unknown);
}
/**
 * Formats an error into a consistent structure for MCP responses
 *
 * @param error The error to format
 * @returns A formatted error object
 */
export declare function formatError(error: unknown): {
    message: string;
    code: string;
    details?: unknown;
};
/**
 * Safely handles errors in async functions and returns a formatted error response
 *
 * @param fn The async function to execute
 * @returns A function that returns either the result or a formatted error
 */
export declare function safeAsync<T, A extends any[]>(fn: (...args: A) => Promise<T>): (...args: A) => Promise<T | {
    error: ReturnType<typeof formatError>;
}>;
