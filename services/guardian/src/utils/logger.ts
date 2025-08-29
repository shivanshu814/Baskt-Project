interface LogLevel {
  level: string;
  timestamp: string;
  message: string;
  meta?: any;
}

class SimpleLogger {
  private logLevel: string;

  constructor(level: string = 'info') {
    this.logLevel = level;
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const targetIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= targetIndex;
  }

  private formatLog(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogLevel = { level, timestamp, message };
    
    if (meta) {
      logEntry.meta = meta;
    }
    
    return JSON.stringify(logEntry);
  }

  // Overloads allow both (obj, msg?) and (msg, obj?) patterns
  debug(meta: object, message?: string): void;
  debug(message: string, meta?: any): void;
  debug(messageOrMeta: string | object, metaOrMessage?: any): void {
    if (!this.shouldLog('debug')) return;
    const { msg, meta } = this.normalizeArgs('Debug', messageOrMeta, metaOrMessage);
    console.log(this.formatLog('debug', msg, meta));
  }

  info(meta: object, message?: string): void;
  info(message: string, meta?: any): void;
  info(messageOrMeta: string | object, metaOrMessage?: any): void {
    if (!this.shouldLog('info')) return;
    const { msg, meta } = this.normalizeArgs('Info', messageOrMeta, metaOrMessage);
    console.log(this.formatLog('info', msg, meta));
  }

  warn(meta: object, message?: string): void;
  warn(message: string, meta?: any): void;
  warn(messageOrMeta: string | object, metaOrMessage?: any): void {
    if (!this.shouldLog('warn')) return;
    const { msg, meta } = this.normalizeArgs('Warning', messageOrMeta, metaOrMessage);
    console.warn(this.formatLog('warn', msg, meta));
  }

  error(meta: object, message?: string): void;
  error(message: string, meta?: any): void;
  error(messageOrMeta: string | object, metaOrMessage?: any): void {
    if (!this.shouldLog('error')) return;
    const { msg, meta } = this.normalizeArgs('Error', messageOrMeta, metaOrMessage);
    console.error(this.formatLog('error', msg, meta));
  }

  private normalizeArgs(defaultMessage: string, a: string | object, b?: any): { msg: string; meta?: any } {
    // Supports:
    // 1) (obj, msg?)
    // 2) (msg, obj?)
    // 3) (msg, string?) -> stored under { context: string }
    if (typeof a === 'object') {
      const meta = a;
      const msg = typeof b === 'string' ? b : defaultMessage;
      return { msg, meta };
    }
    // a is string
    if (b && typeof b === 'object') {
      return { msg: a, meta: b };
    }
    // b is undefined or string
    const meta = typeof b === 'string' ? { context: b } : undefined;
    return { msg: a, meta };
  }
}

export const logger = new SimpleLogger();
