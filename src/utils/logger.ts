/**
 * Logger utility for the Google Cloud MCP server
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
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
class DefaultLogger implements Logger {
  private readonly logToStderr = (level: string, message: string): void => {
    try {
      // Write to stderr to avoid interfering with MCP protocol on stdout
      // Make sure to flush the output immediately
      process.stderr.write(`[${new Date().toISOString()}] [${level}] ${message}\n`);
    } catch (err) {
      // If stderr writing fails, try to write to a file as last resort
      try {
        const fs = require('fs');
        fs.appendFileSync('mcp-error.log', `[${new Date().toISOString()}] [${level}] ${message}\n`);
      } catch (fileErr) {
        // Cannot log anywhere, silently fail
      }
    }
  };

  debug(message: string): void {
    // Only log debug messages if DEBUG environment variable is set
    if (process.env.DEBUG) {
      this.logToStderr('debug', message);
    }
  }

  info(message: string): void {
    this.logToStderr('info', message);
  }

  warn(message: string): void {
    this.logToStderr('warn', message);
  }

  error(message: string | Error): void {
    if (message instanceof Error) {
      this.logToStderr('error', `${message.message}\n${message.stack}`);
    } else {
      this.logToStderr('error', message);
    }
  }
}

// Export a singleton instance of the logger
export const logger = new DefaultLogger();

// Ensure no console.log calls interfere with MCP protocol
// Override console methods to use our logger
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Replace console methods with our logger
console.log = (...args: any[]): void => {
  logger.debug(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};

console.info = (...args: any[]): void => {
  logger.info(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};

console.warn = (...args: any[]): void => {
  logger.warn(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};

console.error = (...args: any[]): void => {
  logger.error(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};
