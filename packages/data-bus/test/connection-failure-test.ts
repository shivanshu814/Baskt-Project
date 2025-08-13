import { DataBus } from '../src/index';

// Test 1: What happens when we create DataBus with bad config and never call connect()?
async function testSilentFailure() {
  console.log('\n=== Test 1: Silent failure with bad config ===');
  
  const dataBus = new DataBus({
    redisUrl: 'redis://badhost:6379',
    signingKey: 'test-key',
    autoConnect: false  // Disable auto-connect to control timing
  });
  
  // Add error handler to prevent unhandled error crashes
  dataBus.on('error', () => { /* ignore */ });
  
  console.log('DataBus created with bad host, no error thrown');
  
  // Try to publish without connecting first
  try {
    console.log('Attempting to publish without connect()...');
    const promise = dataBus.publish('system.heartbeat' as any, { test: true });
    
    // Set a timeout to see if it hangs
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
    );
    
    const result = await Promise.race([promise, timeoutPromise]);
    console.log('Publish succeeded:', result);
  } catch (err: any) {
    console.log('Publish failed:', err.message);
  }
  
  await dataBus.close();
}

// Test 2: What happens with enableOfflineQueue = false?
async function testOfflineQueueDisabled() {
  console.log('\n=== Test 2: enableOfflineQueue = false behavior ===');
  
  const dataBus = new DataBus({
    redisUrl: 'redis://badhost:6379',
    signingKey: 'test-key',
    autoConnect: true,  // Let it auto-connect
    exitOnStartupFailure: false  // Prevent process.exit in tests
  });
  
  // Add event listeners to verify our error handling
  dataBus.on('startup:error', (err) => {
    console.log('✓ Received startup:error event:', err.message);
  });
  
  dataBus.on('error', (err) => {
    console.log('✓ Received error event:', err?.message || 'connection error');
  });
  
  dataBus.on('reconnecting', (delay) => {
    console.log('✓ Received reconnecting event with delay:', delay);
  });
  
  // Give it a moment to try connecting
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    console.log('Attempting to publish with offline queue disabled...');
    const promise = dataBus.publish('system.heartbeat' as any, { test: true });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
    );
    
    const result = await Promise.race([promise, timeoutPromise]);
    console.log('Publish succeeded:', result);
  } catch (err: any) {
    console.log('Publish failed:', err.message);
  }
  
  await dataBus.close();
}

// Test 3: What happens with explicit connect() on bad config?
async function testExplicitConnectFailure() {
  console.log('\n=== Test 3: Explicit connect() with bad config ===');
  
  const dataBus = new DataBus({
    redisUrl: 'redis://badhost:6379',
    signingKey: 'test-key',
    autoConnect: false
  });
  
  // Add error handler to prevent unhandled error crashes
  dataBus.on('error', () => { /* ignore */ });
  
  try {
    console.log('Attempting explicit connect()...');
    const connectPromise = dataBus.connect();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connect timeout after 5s')), 5000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('Connect succeeded');
  } catch (err: any) {
    console.log('Connect failed:', err.message);
  }
  
  await dataBus.close();
}

// Test 4: What happens when first command is issued after successful creation?
async function testDelayedFirstCommand() {
  console.log('\n=== Test 4: Delayed first command ===');
  
  const dataBus = new DataBus({
    redisUrl: 'redis://localhost:6379',  // Assume Redis is running
    signingKey: 'test-key',
    autoConnect: false
  });
  
  console.log('DataBus created, waiting 2s before first command...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    console.log('Issuing first publish...');
    const result = await dataBus.publish('system.heartbeat' as any, { test: true });
    console.log('First publish succeeded:', result);
  } catch (err: any) {
    console.log('First publish failed:', err.message);
  }
  
  await dataBus.close();
}

// Test 5: Health monitoring feature
async function testHealthMonitoring() {
  console.log('\n=== Test 5: Health monitoring ===');
  
  // Test with bad connection
  const badDataBus = new DataBus({
    redisUrl: 'redis://badhost:6379',
    signingKey: 'test-key',
    autoConnect: false,
    exitOnStartupFailure: false
  });
  
  // Add error handler
  badDataBus.on('error', () => { /* ignore */ });
  
  console.log('Checking health of disconnected DataBus...');
  const badHealth = await badDataBus.getHealth();
  console.log('Health status (bad):', JSON.stringify(badHealth, null, 2));
  
  // Test with good connection (if Redis is running)
  const goodDataBus = new DataBus({
    redisUrl: 'redis://localhost:6379',
    signingKey: 'test-key',
    autoConnect: true,
    exitOnStartupFailure: false
  });
  
  goodDataBus.on('ready', async () => {
    console.log('\nChecking health of connected DataBus...');
    const goodHealth = await goodDataBus.getHealth();
    console.log('Health status (good):', JSON.stringify(goodHealth, null, 2));
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await badDataBus.close();
  await goodDataBus.close();
}

// Run all tests
async function runTests() {
  try {
    await testSilentFailure();
    await testOfflineQueueDisabled();
    await testExplicitConnectFailure();
    await testDelayedFirstCommand();
    await testHealthMonitoring();
    console.log('\n✅ All tests completed!');
    process.exit(0);
  } catch (err) {
    console.error('Test suite failed:', err);
    process.exit(1);
  }
}

runTests();
