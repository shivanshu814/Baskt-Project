import { DataBus, STREAMS } from '@baskt/data-bus';
import { TransactionSubmitted, TransactionConfirmed, TransactionFailed } from '@baskt/data-bus';

export class TransactionPublisher {
  constructor(private dataBus: DataBus) {}

  async publishSubmitted(orderId: string, signature: string, type: string): Promise<void> {
    const event: TransactionSubmitted = {
      txId: `${orderId}-${type}`,
      signature,
      type,
      metadata: { orderId },
      timestamp: Date.now().toString()
    };

    await this.dataBus.publish(STREAMS.transaction.submitted, event);
  }

  async publishConfirmed(orderId: string, signature: string, type: string, slot: number): Promise<void> {
    const event: TransactionConfirmed = {
      txId: `${orderId}-${type}`,
      signature,
      slot,
      type,
      metadata: { orderId },
      timestamp: Date.now().toString()
    };

    await this.dataBus.publish(STREAMS.transaction.confirmed, event);
  }

  async publishFailed(orderId: string, signature: string, type: string, error: string): Promise<void> {
    const event: TransactionFailed = {
      txId: `${orderId}-${type}`,
      signature,
      error,
      type,
      metadata: { orderId },
      timestamp: Date.now().toString()
    };

    await this.dataBus.publish(STREAMS.transaction.failed, event);
  }
}