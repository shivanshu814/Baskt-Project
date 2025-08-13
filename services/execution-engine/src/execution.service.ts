import { DataBus, STREAMS, MessageEnvelope, OrderAccepted, logger, BasktCreatedMessage } from '@baskt/data-bus';
import { OrderWorker } from './workers/order.worker';
import { ExecutionConfig } from './types';
import { BasktWorker } from './workers';

export class ExecutionService {
  private dataBus: DataBus;
  private isRunning = false;

 
  private asyncWorkers: {
    order: OrderWorker;
    baskt: BasktWorker;
  }

  constructor(private config: ExecutionConfig) {
    this.dataBus = new DataBus({
      redisUrl: config.redis.url,
      autoConnect: false
    });

    this.asyncWorkers = {
      order: new OrderWorker(this.dataBus),
      baskt: new BasktWorker(this.dataBus)
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
    await this.asyncWorkers.baskt.start();
    this.isRunning = true;
    logger.info('Execution service started');
  }


  private async handleBasktCreated(envelope: MessageEnvelope<BasktCreatedMessage>): Promise<void> {
    await this.asyncWorkers.baskt.addJob({
      data: envelope.payload,
      jobType: STREAMS.baskt.created,
      jobId: envelope.id
    });
  }

  private async handleOrderAccepted(envelope: MessageEnvelope<OrderAccepted>): Promise<void> {
    await this.asyncWorkers.order.addJob({
      data: envelope.payload,
      jobType: STREAMS.order.accepted,
      jobId: envelope.id
    });
  }

  async stop(): Promise<void> {
    logger.info('Stopping execution service...');

    // Stop workers (they handle their own queue cleanup)
    await Promise.all([
      this.asyncWorkers.order.stop(),
      this.asyncWorkers.baskt.stop()
    ]);

    // Close data bus
    await this.dataBus.close();

    this.isRunning = false;
  }

  async getHealth() {
    const [orderStats, basktStats] = await Promise.all([
      this.asyncWorkers.order.getQueueStats(),
      this.asyncWorkers.baskt.getQueueStats()
    ]);

    return {
      healthy: this.isRunning,
      service: 'execution-engine',
      uptime: process.uptime(),
      queues: {
        'order-execution': orderStats,
        'baskt-execution': basktStats
      }
    };
  }
}