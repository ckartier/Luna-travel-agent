import { describe, it, expect } from 'vitest';
import { logger } from '../src/lib/logger';

describe('logger', () => {
    it('should have all 5 log methods', () => {
        expect(typeof logger.debug).toBe('function');
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.fatal).toBe('function');
    });

    it('should have child logger factory', () => {
        const child = logger.child({ service: 'test' });
        expect(typeof child.info).toBe('function');
        expect(typeof child.error).toBe('function');
    });

    it('debug should not throw', () => {
        expect(() => logger.debug('test message', { key: 'value' })).not.toThrow();
    });

    it('info should not throw', () => {
        expect(() => logger.info('test message')).not.toThrow();
    });

    it('warn should not throw', () => {
        expect(() => logger.warn('warning', { detail: 'x' })).not.toThrow();
    });

    it('error with Error object should not throw', () => {
        expect(() => logger.error('fail', {}, new Error('test error'))).not.toThrow();
    });

    it('fatal should not throw', () => {
        expect(() => logger.fatal('critical', { code: 500 }, new Error('fatal'))).not.toThrow();
    });

    it('child logger should not throw', () => {
        const child = logger.child({ requestId: 'abc' });
        expect(() => child.info('child log', { extra: true })).not.toThrow();
        expect(() => child.error('child error', {}, new Error('err'))).not.toThrow();
    });
});
