# Event Scenarios for Development Testing

This directory contains event scenario files that can be used with the `event-producer.ts` script to simulate various trading conditions and test offchain services in isolation.

## Quick Start

```bash
# Run a scenario once
pnpm -F @baskt/data-bus exec ts-node scripts/event-producer.ts -f scenarios/trade-and-liquidate.yaml

# Run in verbose mode to see payloads
pnpm -F @baskt/data-bus exec ts-node scripts/event-producer.ts -f scenarios/trade-and-liquidate.yaml -v

# Loop a scenario continuously (great for soak testing)
pnpm -F @baskt/data-bus exec ts-node scripts/event-producer.ts -f scenarios/high-frequency-trading.yaml --loop --loop-interval 10000

# Dry run to validate without publishing
pnpm -F @baskt/data-bus exec ts-node scripts/event-producer.ts -f scenarios/funding-rate-impact.yaml --dry-run

# Pass variables from command line
pnpm -F @baskt/data-bus exec ts-node scripts/event-producer.ts -f scenarios/trade-and-liquidate.yaml --variable userId=test_user_123
```

## Scenario File Format

Scenarios are defined in YAML (or JSON) with the following structure:

```yaml
name: Scenario Name
description: Optional description of what this scenario tests

events:
  - stream: stream.name      # Required: Stream name from STREAMS constant
    payload: { ... }         # Option 1: Explicit payload data
    generator: true          # Option 2: Use fixture generator
    delay: 1000             # Optional: Delay in ms before publishing
    repeat: 5               # Optional: Repeat this event N times
    interval: 500           # Optional: Interval between repeats
    variables:              # Optional: Variables for this event
      key: value
```

## Available Scenarios

### trade-and-liquidate.yaml
Simulates a complete position lifecycle from opening to liquidation:
- Establishes initial price
- Opens a leveraged long position
- Simulates price drops
- Triggers liquidation signal
- Executes liquidation

**Use case**: Testing liquidation engine behavior, risk management systems

### high-frequency-trading.yaml
Generates rapid, random order flow using fixture generators:
- Multiple price updates
- Rapid order requests
- Mixed accepts/rejects (70% acceptance rate)
- Position lifecycle events
- Service heartbeats

**Use case**: Load testing, performance testing, event processing latency

### funding-rate-impact.yaml
Tests funding rate mechanics and their impact on positions:
- Creates multiple long and short positions
- Changes funding rates (positive → high positive → negative)
- Simulates position closures due to funding costs
- Tracks system state

**Use case**: Testing funding calculation services, position management

## Creating New Scenarios

### 1. Using Explicit Payloads

```yaml
events:
  - stream: order.request
    payload:
      orderId: "order_123"
      user: "alice"
      basketId: "basket_1"
      size: "10000"
      collateral: "2000"
      isLong: true
      leverage: 5
      timestamp: "{{timestamp}}"  # Variable substitution
```

### 2. Using Generators

```yaml
events:
  - stream: order.request
    generator: true  # Uses test-utils fixture builder
    repeat: 10      # Generate 10 random orders
    interval: 1000  # 1 second between each
```

### 3. Using Variables

Variables can be defined at the event level and referenced in payloads:

```yaml
events:
  - stream: position.opened
    variables:
      basePrice: 50000
      user: "test_user"
    payload:
      positionId: "pos_{{index}}"  # {{index}} is auto-incremented for repeats
      user: "{{user}}"
      entryPrice: "{{basePrice}}"
```

### 4. Timing Control

```yaml
events:
  - stream: price.update
    delay: 5000      # Wait 5 seconds before publishing
    payload: { ... }
    
  - stream: order.request
    delay: 1000      # Wait 1 second
    repeat: 5        # Publish 5 times
    interval: 500    # 500ms between each
    generator: true
```

## Development Workflow

1. **Start your target service** (e.g., execution-engine)
   ```bash
   pnpm -F @baskt/execution-engine dev
   ```

2. **Run event producer with a scenario**
   ```bash
   pnpm -F @baskt/data-bus exec ts-node scripts/event-producer.ts -f scenarios/your-scenario.yaml
   ```

3. **Observe service behavior** through logs and debugging

4. **Iterate quickly** - modify the scenario file and re-run instantly

## Best Practices

1. **Start simple**: Begin with basic scenarios and add complexity gradually
2. **Use generators for randomness**: When you need varied data, use `generator: true`
3. **Document your scenarios**: Add clear names and descriptions
4. **Version control scenarios**: Commit useful scenarios for team reuse
5. **Combine approaches**: Mix explicit payloads and generators in the same scenario

## Integration with CI/CD

These scenarios can be integrated into automated testing:

```bash
# In your test script
./scripts/event-producer.ts -f scenarios/smoke-test.yaml --dry-run || exit 1
./scripts/event-producer.ts -f scenarios/integration-test.yaml --variable env=ci
```

## Troubleshooting

- **Schema validation errors**: Ensure payloads match the Zod schemas in `@baskt/shared`
- **Connection errors**: Check Redis is running and REDIS_URL is correct
- **Missing streams**: Verify stream names match those in `STREAMS` constant
- **Variable not substituted**: Check variable is defined and syntax is `{{varName}}`