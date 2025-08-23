import { Handler, EventSource, ObserverEvent } from './types';
import { EventProcessStatus } from '@baskt/querier';

export class ObserverRouter {
  private handlers: Record<string, Handler[]> = {};
  sourceToEvents: Record<EventSource, string[]> = {
    [EventSource.SOLANA]: [],
    [EventSource.MONGO]: [],
    [EventSource.POSTGRES]: [],
  };
  private loggerFn: (message: string) => void;
  private eventsStorage: any; // Will be set when querier client is available

  constructor(logger = console.log) {
    this.loggerFn = logger;
  }

  /**
   * Set the events storage service from querier client
   */
  setEventsStorage(eventsStorage: any): void {
    this.eventsStorage = eventsStorage;
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
   * @param eventTx The transaction signature for the event (optional)
   */
  emit(event: ObserverEvent, eventTx?: string): void {
    const key = `${event.source}:${event.name}`;
    const handlers = this.handlers[key] || [];

    // Store the event if eventsStorage is available and eventTx is provided
    if (this.eventsStorage && eventTx) {
      this.storeEvent(event, eventTx).catch(error => {
        this.logger(`[observer-router] Failed to store event ${key}: ${error}`);
      });
    }

    if (handlers.length === 0) {
      this.logger(`[observer-router] No handlers registered for ${key}`);
      // Mark as completed since no processing is needed
      if (this.eventsStorage && eventTx) {
        this.markEventAsCompleted(eventTx).catch(error => {
          this.logger(`[observer-router] Failed to mark event as completed: ${error}`);
        });
      }
      return;
    }

    this.logger(`[observer-router] Emitting event ${key} to ${handlers.length} handlers`);

    // Mark as processing if eventsStorage is available
    if (this.eventsStorage && eventTx) {
      this.markEventAsProcessing(eventTx).catch(error => {
        this.logger(`[observer-router] Failed to mark event as processing: ${error}`);
      });
    }

    handlers.forEach((handler) => {
      // Async, but not awaited
      Promise.resolve().then(async () => {
        try {
          const result = await handler(event);
          return { success: true, result };
        } catch (error) {
          this.logger(`[observer-router] Error in handler for ${key}: ${error}`);
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
             }).then(async (handlerResult) => {
         // Update event status based on handler result
         if (this.eventsStorage && eventTx) {
           if (handlerResult.success) {
             await this.markEventAsCompleted(eventTx);
           } else {
             await this.markEventAsFailed(eventTx, handlerResult.error || 'Unknown error');
           }
         }
       }).catch(async (error) => {
         // Mark as failed if handler throws an error
         if (this.eventsStorage && eventTx) {
           await this.markEventAsFailed(eventTx, String(error));
         }
       });
    });
  }

  /**
   * Store an event in the database
   */
  private async storeEvent(event: ObserverEvent, eventTx: string): Promise<void> {
    try {
      await this.eventsStorage.storeEvent(event, eventTx);
    } catch (error) {
      this.logger(`[observer-router] Failed to store event: ${error}`);
      throw error;
    }
  }

  /**
   * Mark an event as processing
   */
  private async markEventAsProcessing(eventTx: string): Promise<void> {
    try {
      await this.eventsStorage.markAs(eventTx, EventProcessStatus.PROCESSING);
    } catch (error) {
      this.logger(`[observer-router] Failed to mark event as processing: ${error}`);
      throw error;
    }
  }

  /**
   * Mark an event as completed
   */
  private async markEventAsCompleted(eventTx: string): Promise<void> {
    try {
      await this.eventsStorage.markAs(eventTx, EventProcessStatus.COMPLETED);
    } catch (error) {
      this.logger(`[observer-router] Failed to mark event as completed: ${error}`);
      throw error;
    }
  }

  /**
   * Mark an event as failed
   */
  private async markEventAsFailed(eventTx: string, error: string): Promise<void> {
    try {
      await this.eventsStorage.markAs(eventTx, EventProcessStatus.FAILED, error);
    } catch (error) {
      this.logger(`[observer-router] Failed to mark event as failed: ${error}`);
      throw error;
    }
  }
}
