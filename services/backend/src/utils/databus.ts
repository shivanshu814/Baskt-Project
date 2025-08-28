import { DataBus, logger, StreamName } from '@baskt/data-bus';

let dataBusInstance: DataBus | null = null;

export const getDataBus = (): DataBus => {
  if (!dataBusInstance) {
    dataBusInstance = new DataBus({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      autoConnect: false,
    });
  }
  return dataBusInstance;
};

export const initializeDataBus = async (): Promise<void> => {
  try {
    const db = getDataBus();
    logger.info('DataBus initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize DataBus:', error);
    throw error;
  }
};

export const shutdownDataBus = async (): Promise<void> => {
  try {
    if (dataBusInstance) {
      await dataBusInstance.close();
      dataBusInstance = null;
      logger.info('DataBus shutdown successfully');
    }
  } catch (error) {
    logger.error('Error during DataBus shutdown:', error);
  }
};

export const publishToDataBus = async (stream: StreamName, payload: any): Promise<boolean> => {
  try {
    const db = getDataBus();
    await db.publish(stream, payload);
    return true;
  } catch (error: any) {
    if (error.message?.includes('Redis is already connecting/connected')) {
      const db = getDataBus();
      await db.publish(stream, payload);
      return true;
    }
    throw error;
  }
};
