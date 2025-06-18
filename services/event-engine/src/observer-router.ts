import { Handler, EventSource, ObserverEvent } from './types';

export class ObserverRouter {
  private handlers: Record<string, Handler[]> = {};
  sourceToEvents: Record<EventSource, string[]> = {
    [EventSource.SOLANA]: [],
    [EventSource.MONGO]: [],
    [EventSource.POSTGRES]: [],
  };
  private loggerFn: (message: string) => void;

  constructor(logger = console.log) {
    this.loggerFn = logger;
  }

  /**
   * Log a message using the configured logger
   * @param message The message to log
   */
  public logger(message: string): void {
    this.loggerFn(message);
  }

  /**
   * Register a handler for a specific event source and type
   * @param source The event source (e.g., 'solana', 'mongo', 'postgres')
   * @param name The event name (e.g., 'baskt-created')
   * @param handler The handler function to be called when an event is emitted
   */
  register(source: EventSource, name: string, handler: Handler): void {
    const key = `${source}:${name}`;
    if (!this.handlers[key]) this.handlers[key] = [];
    this.handlers[key].push(handler);
    this.sourceToEvents[source].push(name);
    this.logger(`[observer-router] Registered handler for ${key}`);
  }

  /**
   * Emit an event to all registered handlers for the given source and type
   * @param event The event to emit
   */
  emit(event: ObserverEvent): void {
    const key = `${event.source}:${event.name}`;
    const handlers = this.handlers[key] || [];

    if (handlers.length === 0) {
      this.logger(`[observer-router] No handlers registered for ${key}`);
      return;
    }

    this.logger(`[observer-router] Emitting event ${key} to ${handlers.length} handlers`);

    handlers.forEach((handler) => {
      // Async, but not awaited
      Promise.resolve().then(() => {
        try {
          return handler(event);
        } catch (error) {
          this.logger(`[observer-router] Error in handler for ${key}: ${error}`);
        }
      });
    });
  }
}
