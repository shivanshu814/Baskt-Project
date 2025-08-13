# Redis Stream Monitoring & Testing Scripts

This directory contains utility scripts for monitoring and testing the Redis streams infrastructure.

## Stream Health Dashboard

Real-time monitoring dashboard for all 18 Redis streams.

### Usage

```bash
# Run with default refresh rate (1 second)
pnpm -F @baskt/data-bus dashboard

# Run with custom refresh rate (milliseconds)
pnpm -F @baskt/data-bus dashboard 2000

# Or run directly
cd services/data-bus
pnpm dashboard
```

### Features

- **Real-time Monitoring**: Updates every second (configurable)
- **Stream Metrics**: Length, consumer groups, pending messages
- **Dead Letter Detection**: Shows count of messages in dead letter queues
- **Retention Monitoring**: Alerts when messages exceed retention policy
- **Activity Tracking**: Shows last message timestamp
- **Anomaly Detection**: 
  - High pending messages (>100)
  - Dead letters present
  - Near capacity warnings
  - Retention violations
  - Inactive streams (especially critical for price feeds)

### Dashboard Display

The dashboard shows:
- Stream name and current length
- Consumer groups with pending count
- Dead letter count
- Message age (oldest message)
- Last activity timestamp
- Health status with specific anomalies

## Event Emitter

Comprehensive testing tool for Redis streams.

### Usage

```bash
# Run the event emitter tests
pnpm -F @baskt/data-bus emitter

# Or run directly
cd services/data-bus
pnpm emitter
```

### Test Categories

1. **Basic Publishing**
   - Tests empty and basic payloads
   - Stream-specific test messages
   - Validates message acceptance

2. **Signature Validation**
   - Tests valid signatures are accepted
   - Ensures invalid signatures are rejected
   - Validates cryptographic security

3. **Payload Size Limits**
   - Tests small payloads (accepted)
   - Tests 100KB payloads (accepted)
   - Tests 1MB payloads (should be rejected)

4. **Retention Policies**
   - Checks current stream length
   - Validates message age against retention
   - Reports retention violations

### Stream-Specific Tests

Each stream type has custom test payloads:

- **Price Streams**: Asset prices, multi-asset updates
- **Order Streams**: Buy/sell orders with various parameters
- **Position Streams**: Long/short positions with leverage
- **Risk Streams**: Liquidation signals, funding rates
- **System Streams**: Service heartbeats, trading halts
- **Transaction Streams**: Blockchain transaction lifecycle

### Environment Variables

```bash
# Redis connection (defaults to localhost)
REDIS_URL=redis://localhost:6379

# Signing key for message signatures
SIGNING_KEY=your-private-key
```

## Monitoring Best Practices

1. **Dashboard Usage**
   - Run continuously during development
   - Monitor during load testing
   - Check before deployments
   - Use for debugging stream issues

2. **Alert Response**
   - **Dead Letters**: Investigate consumer errors immediately
   - **High Pending**: Check if consumers are running
   - **Retention Violations**: May need manual cleanup
   - **Inactive Streams**: Critical for price feeds

3. **Testing Workflow**
   - Run emitter after stream configuration changes
   - Verify all tests pass before production
   - Use for regression testing
   - Document any expected failures

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check Redis is running
   - Verify REDIS_URL is correct
   - Check network connectivity

2. **Permission Errors**
   - Ensure Redis user has stream permissions
   - Check ACL configuration

3. **Test Failures**
   - Review error messages in results
   - Check stream configurations
   - Verify signing keys match

### Debug Mode

For verbose output, modify the scripts to add debug logging:

```typescript
// Add to scripts for debug info
console.log(chalk.gray('DEBUG:', JSON.stringify(data, null, 2)))
```