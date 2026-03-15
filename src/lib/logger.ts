/**
 * Structured Logger Module
 * 
 * JSON-formatted logs for production monitoring.
 * Levels: debug, info, warn, error, fatal
 * 
 * Usage:
 *   logger.info('User login', { userId: '123', ip: '1.2.3.4' });
 *   logger.error('Payment failed', { orderId: 'xxx' }, error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    service: string;
    environment: string;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
};

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function createEntry(level: LogLevel, message: string, context?: Record<string, any>, err?: Error): LogEntry {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        service: 'luna-crm',
        environment: process.env.NODE_ENV || 'development',
    };

    if (context && Object.keys(context).length > 0) entry.context = context;
    if (err) {
        entry.error = {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        };
    }

    return entry;
}

function emit(entry: LogEntry): void {
    const output = JSON.stringify(entry);
    switch (entry.level) {
        case 'error':
        case 'fatal':
            console.error(output);
            break;
        case 'warn':
            console.warn(output);
            break;
        default:
            console.log(output);
    }
}

export const logger = {
    debug(message: string, context?: Record<string, any>): void {
        if (!shouldLog('debug')) return;
        emit(createEntry('debug', message, context));
    },

    info(message: string, context?: Record<string, any>): void {
        if (!shouldLog('info')) return;
        emit(createEntry('info', message, context));
    },

    warn(message: string, context?: Record<string, any>): void {
        if (!shouldLog('warn')) return;
        emit(createEntry('warn', message, context));
    },

    error(message: string, context?: Record<string, any>, err?: Error): void {
        if (!shouldLog('error')) return;
        emit(createEntry('error', message, context, err));
    },

    fatal(message: string, context?: Record<string, any>, err?: Error): void {
        emit(createEntry('fatal', message, context, err));
    },

    /** Create a child logger with preset context */
    child(baseContext: Record<string, any>) {
        return {
            debug: (msg: string, ctx?: Record<string, any>) => logger.debug(msg, { ...baseContext, ...ctx }),
            info: (msg: string, ctx?: Record<string, any>) => logger.info(msg, { ...baseContext, ...ctx }),
            warn: (msg: string, ctx?: Record<string, any>) => logger.warn(msg, { ...baseContext, ...ctx }),
            error: (msg: string, ctx?: Record<string, any>, err?: Error) => logger.error(msg, { ...baseContext, ...ctx }, err),
            fatal: (msg: string, ctx?: Record<string, any>, err?: Error) => logger.fatal(msg, { ...baseContext, ...ctx }, err),
        };
    },
};
