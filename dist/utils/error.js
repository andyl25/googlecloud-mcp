/**
 * Error handling utilities
 */
/**
 * Custom error class for Google Cloud MCP server errors
 */
export class GcpMcpError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, details) {
        super(message);
        this.name = 'GcpMcpError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}
/**
 * Formats an error into a consistent structure for MCP responses
 *
 * @param error The error to format
 * @returns A formatted error object
 */
export function formatError(error) {
    if (error instanceof GcpMcpError) {
        return {
            message: error.message,
            code: error.code,
            details: error.details
        };
    }
    if (error instanceof Error) {
        return {
            message: error.message,
            code: 'UNKNOWN_ERROR',
            details: error.stack
        };
    }
    return {
        message: String(error),
        code: 'UNKNOWN_ERROR'
    };
}
/**
 * Safely handles errors in async functions and returns a formatted error response
 *
 * @param fn The async function to execute
 * @returns A function that returns either the result or a formatted error
 */
export function safeAsync(fn) {
    return async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            console.error('Error in async operation:', error);
            return { error: formatError(error) };
        }
    };
}
//# sourceMappingURL=error.js.map