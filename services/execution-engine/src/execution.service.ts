import { DataBus, STREAMS, MessageEnvelope, OrderAccepted, logger, serializeMessage, BasktCreatedMessage } from '@baskt/data-bus';
import { executionQueue } from './config/queue';
import { OrderWorker } from './workers/order.worker';
import { ExecutionConfig } from './types';
import { BasktExecutor } from './executors';

export class ExecutionService {
  private dataBus: DataBus;
  private isRunning = false;

  private executors: {
    baskt: BasktExecutor;
  };

  private asyncWorkers: {
    order: OrderWorker;
  }

  constructor(private config: ExecutionConfig) {
    this.dataBus = new DataBus({
      redisUrl: config.redis.url,
      signingKey: config.dataBus.signingKey,
      autoConnect: false
    });

    this.executors = {
      baskt: new BasktExecutor()
    };

    this.asyncWorkers = {
      order: new OrderWorker(this.dataBus)
    };
  }

  async start(): Promise<void> {
    await this.dataBus.connect();

    // Consume order.accepted events (runs in background)
    this.dataBus.consume(
      STREAMS.order.accepted,
      'execution',
      `execution-${process.env.INSTANCE_ID || '1'}`,
      async (envelope: MessageEnvelope<OrderAccepted>) => {
        await this.handleOrderAccepted(envelope);
      }
    );

    this.dataBus.consume(
      STREAMS.baskt.created,
      'execution',
      `execution-${process.env.INSTANCE_ID || '1'}`,
      async (envelope: MessageEnvelope<BasktCreatedMessage>) => {
        await this.handleBasktCreated(envelope);
      }
    );

    // Start worker
    await this.asyncWorkers.order.start();

    this.isRunning = true;
    logger.info('Execution service started');
  }


  private async handleBasktCreated(envelope: MessageEnvelope<BasktCreatedMessage>): Promise<void> {
    await this.executors.baskt.activateBaskt(envelope.payload);
  }

  private async handleOrderAccepted(envelope: MessageEnvelope<OrderAccepted>): Promise<void> {
    const order = envelope.payload;
    // Use orderId-action for idempotency
    const jobId = `${order.request.order.orderId}-${order.request.order.action}`;

    await executionQueue.add(
      'order-execution',
      serializeMessage(order),
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false
      }
    );

    logger.info('Order queued for execution', { orderId: order.request.order.orderId, jobId });
  }

  async stop(): Promise<void> {
    logger.info('Stopping execution service...');

    // Close queue first to prevent new jobs
    await executionQueue.close();

    // Stop worker
    await this.asyncWorkers.order.stop();

    // Close data bus
    await this.dataBus.close();

    this.isRunning = false;
  }

  async getHealth() {
    const [waiting, active, completed, failed] = await Promise.all([
      executionQueue.getWaitingCount(),
      executionQueue.getActiveCount(),
      executionQueue.getCompletedCount(),
      executionQueue.getFailedCount()
    ]);

    return {
      healthy: this.isRunning,
      service: 'execution-engine',
      uptime: process.uptime(),
      queues: {
        execution: {
          waiting,
          active,
          completed,
          failed
        }
      }
    };
  }
}