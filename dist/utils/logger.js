/**
 * Logger utility for the Google Cloud MCP server
 */
/**
 * Log levels
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
/**
 * Default logger implementation that writes to stderr
 * to avoid interfering with MCP protocol communication on stdout
 */
class DefaultLogger {
    logToStderr = (level, message) => {
        try {
            // Write to stderr to avoid interfering with MCP protocol on stdout
            // Make sure to flush the output immediately
            process.stderr.write(`[${new Date().toISOString()}] [${level}] ${message}\n`);
        }
        catch (err) {
            // If stderr writing fails, try to write to a file as last resort
            try {
                const fs = require('fs');
                fs.appendFileSync('mcp-error.log', `[${new Date().toISOString()}] [${level}] ${message}\n`);
            }
            catch (fileErr) {
                // Cannot log anywhere, silently fail
            }
        }
    };
    debug(message) {
        // Only log debug messages if DEBUG environment variable is set
        if (process.env.DEBUG) {
            this.logToStderr('debug', message);
        }
    }
    info(message) {
        this.logToStderr('info', message);
    }
    warn(message) {
        this.logToStderr('warn', message);
    }
    error(message) {
        if (message instanceof Error) {
            this.logToStderr('error', `${message.message}\n${message.stack}`);
        }
        else {
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
console.log = (...args) => {
    logger.debug(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};
console.info = (...args) => {
    logger.info(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};
console.warn = (...args) => {
    logger.warn(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};
console.error = (...args) => {
    logger.error(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
};
//# sourceMappingURL=logger.js.map