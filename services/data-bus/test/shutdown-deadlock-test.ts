import { DataBus } from '../src/index';
import { STREAMS } from '../src/streams';

// Test to demonstrate the potential deadlock in graceful shutdown
async function testShutdownDeadlock() {
  console.log('\n=== Testing Graceful Shutdown Deadlock Scenario ===');
  
  const dataBus = new DataBus({
    redisUrl: 'redis://localhost:6379',
    signingKey: 'test-key',
    autoConnect: false
  });

  await dataBus.connect();
  
  // Start a consumer that simulates being stuck
  const consumerPromise = dataBus.consume(
    STREAMS.system.heartbeat,
    'test-group',
    'test-consumer',
    async (msg) => {
      console.log('Processing message:', msg.id);
      
      // Simulate a stuck handler that ignores abort signals
      // This could happen if the handler is:
      // 1. Waiting on an external service that doesn't timeout
      // 2. In an infinite loop
      // 3. Blocked on I/O that doesn't respect cancellation
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Handler still running, ignoring shutdown...');
      }
    }
  );

  // Give the consumer time to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Publish a message to trigger the stuck handler
  await dataBus.publish(STREAMS.system.heartbeat, { test: true });
  
  // Wait for handler to start processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\nAttempting graceful shutdown...');
  console.log('This should timeout after 10 seconds and force exit');
  
  // Simulate SIGTERM
  process.emit('SIGTERM' as any);
  
  // The process should exit within 10 seconds
  // If it doesn't, the deadlock is confirmed
}

// Test what happens with blocking Redis operations during shutdown
async function testBlockingOperationDuringShutdown() {
  console.log('\n=== Testing Blocking Operation During Shutdown ===');
  
  const dataBus = new DataBus({
    redisUrl: 'redis://localhost:6379',
    signingKey: 'test-key',
    autoConnect: false
  });

  await dataBus.connect();
  
  // Start a consumer with a long block timeout
  const consumerPromise = dataBus.consume(
    STREAMS.system.heartbeat,
    'test-group-2',
    'test-consumer-2',
    async (msg) => {
      console.log('Processing message:', msg.id);
    },
    {
      blockMs: 30000  // 30 second block timeout
    }
  );

  // Give the consumer time to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\nConsumer is now blocked on xreadgroup with 30s timeout');
  console.log('Attempting shutdown - will the consumer exit cleanly?');
  
  // Track shutdown timing
  const shutdownStart = Date.now();
  
  // Attempt to close the DataBus
  await dataBus.close();
  
  const shutdownDuration = Date.now() - shutdownStart;
  console.log(`Shutdown completed in ${shutdownDuration}ms`);
  
  if (shutdownDuration > 1000) {
    console.log('WARNING: Shutdown took longer than expected!');
    console.log('Consumer may have been stuck waiting for Redis operation to complete');
  }
}

// Run tests
async function runTests() {
  try {
    // First test the blocking operation scenario
    await testBlockingOperationDuringShutdown();
    
    // Then test the deadlock scenario (this will force exit)
    await testShutdownDeadlock();
  } catch (err) {
    console.error('Test failed:', err);
  }
}

runTests();
