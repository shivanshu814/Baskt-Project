import { SolanaEventsModel } from '../models/mongodb';
import { EventProcessStatus, SolanaEventsMetadata } from '../types/models';



export class EventsStorageService {
  private static instance: EventsStorageService;

  private constructor() {}

  public static getInstance(): EventsStorageService {
    if (!EventsStorageService.instance) {
      EventsStorageService.instance = new EventsStorageService();
    }
    return EventsStorageService.instance;
  }

  /**
   * Store a new event in the database
   */
  async storeEvent(event: any, eventTx: string): Promise<SolanaEventsMetadata> {
    try {
      const eventData: Partial<SolanaEventsMetadata> = {
        eventName: event.name,
        payload: JSON.stringify(event.payload),
        eventTx,
        processStatus: EventProcessStatus.PENDING,
      };

      const storedEvent = await SolanaEventsModel.create(eventData);
      console.log(`[events-storage] Stored event: ${event.name} with tx: ${eventTx}`);
      
      return {
        ...storedEvent.toObject(),
        _id: storedEvent._id.toString(),
        error: storedEvent.error || undefined,
      };
    } catch (error) {
      console.error(`[events-storage] Failed to store event: ${event.name}`, error);
      throw error;
    }
  }

  /**
   * Mark an event with a specific status
   */
  async markAs(eventTx: string, status: EventProcessStatus, error?: string): Promise<void> {
    try {
      const updateData: any = { processStatus: status };
      if (error) {
        updateData.error = error;
      }

      await SolanaEventsModel.updateOne({ eventTx }, updateData);
      console.log(`[events-storage] Marked event as ${status}: ${eventTx}`);
    } catch (error) {
      console.error(`[events-storage] Failed to mark event as ${status}: ${eventTx}`, error);
      throw error;
    }
  }

  /**
   * Get events by name and status
   */
  async getEventsByNameAndStatus(
    eventName: string, 
    status: EventProcessStatus, 
    limit: number = 100
  ): Promise<SolanaEventsMetadata[]> {
    try {
      const events = await SolanaEventsModel
        .find({ eventName, processStatus: status })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return events.map(event => ({ 
        ...event,
        _id: event._id.toString(),
        error: event.error || undefined
      }));
    } catch (error) {
      console.error(`[events-storage] Failed to get events by name and status: ${eventName}`, error);
      throw error;
    }
  }
}
