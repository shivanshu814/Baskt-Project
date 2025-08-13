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

  debug(message: string | object, meta?: string): void {
    if (!this.shouldLog('debug')) return;
    
    if (typeof message === 'object') {
      console.log(this.formatLog('debug', meta || 'Debug', message));
    } else {
      console.log(this.formatLog('debug', message, meta ? { context: meta } : undefined));
    }
  }

  info(message: string | object, meta?: string): void {
    if (!this.shouldLog('info')) return;
    
    if (typeof message === 'object') {
      console.log(this.formatLog('info', meta || 'Info', message));
    } else {
      console.log(this.formatLog('info', message, meta ? { context: meta } : undefined));
    }
  }

  warn(message: string | object, meta?: string): void {
    if (!this.shouldLog('warn')) return;
    
    if (typeof message === 'object') {
      console.warn(this.formatLog('warn', meta || 'Warning', message));
    } else {
      console.warn(this.formatLog('warn', message, meta ? { context: meta } : undefined));
    }
  }

  error(message: string | object, meta?: string): void {
    if (!this.shouldLog('error')) return;
    
    if (typeof message === 'object') {
      console.error(this.formatLog('error', meta || 'Error', message));
    } else {
      console.error(this.formatLog('error', message, meta ? { context: meta } : undefined));
    }
  }
}

export const logger = new SimpleLogger();
