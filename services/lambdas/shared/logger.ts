/**
 * Structured logging utility for Lambda functions
 * Provides consistent JSON logging with correlation IDs and log levels
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  videoId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  metadata?: Record<string, any>;
}

/**
 * Structured logger for Lambda functions
 */
export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Log a message at DEBUG level
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log a message at INFO level
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a message at WARN level
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log a message at ERROR level
   */
  error(message: string, error?: Error | unknown, metadata?: Record<string, any>): void {
    const errorMetadata: Record<string, any> = {
      ...metadata,
    };

    if (error instanceof Error) {
      errorMetadata.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorMetadata.error = error;
    }

    this.log(LogLevel.ERROR, message, errorMetadata);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: Object.keys(this.context).length > 0 ? this.context : undefined,
      metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    // Output as JSON for CloudWatch Logs Insights
    console.log(JSON.stringify(entry));
  }
}

/**
 * Create a logger instance
 */
export function createLogger(context?: LogContext): Logger {
  return new Logger(context);
}

