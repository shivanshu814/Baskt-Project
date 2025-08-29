export const STREAMS = {
  baskt: {
    created: 'baskt.created'
  },
  rebalance: {
    requested: 'rebalance.requested'
  },
  price: {
    update: 'price.update',
    nav: 'basket.nav'
  },
  order: {
    request: 'order.request',
    accepted: 'order.accepted',
    rejected: 'order.rejected',
    cancelled: 'order.cancelled'
  },
  position: {
    opened: 'position.opened',
    closed: 'position.closed',
    liquidated: 'position.liquidated'
  },
  risk: {
    liquidation: 'liquidation.signal',
    funding: 'funding.update'
  },
  system: {
    snapshot: 'snapshot.commit',
    heartbeat: 'service.heartbeat',
    halt: 'trading.halt'
  },
  transaction: {
    submitted: 'tx.submitted',
    confirmed: 'tx.confirmed',
    failed: 'tx.failed'
  }
} as const;

// Type to extract all leaf string values from nested object
type ExtractLeafValues<T> = T extends string
  ? T
  : T extends object
  ? { [K in keyof T]: ExtractLeafValues<T[K]> }[keyof T]
  : never;

export type StreamName = ExtractLeafValues<typeof STREAMS>;

// Utility function to get all stream values for iteration
export function getAllStreamValues(): StreamName[] {
  const values: string[] = [];

  function extractValues(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        values.push(obj[key]);
      } else if (typeof obj[key] === 'object') {
        extractValues(obj[key]);
      }
    }
  }

  extractValues(STREAMS);
  return values as StreamName[];
}
