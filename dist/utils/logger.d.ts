/**
 * Logger utility for the Google Cloud MCP server
 */
/**
 * Log levels
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
/**
 * Logger interface
 */
export interface Logger {
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string | Error): void;
}
/**
 * Default logger implementation that writes to stderr
 * to avoid interfering with MCP protocol communication on stdout
 */
declare class DefaultLogger implements Logger {
    private readonly logToStderr;
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string | Error): void;
}
export declare const logger: DefaultLogger;
export {};
