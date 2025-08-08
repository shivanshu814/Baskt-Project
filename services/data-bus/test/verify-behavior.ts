import Redis from 'ioredis';

// Test 1: Basic ioredis behavior with bad config
async function testIoRedisBasic() {
  console.log('\n=== Test 1: Basic ioredis behavior ===');
  
  // Default ioredis - lazyConnect: false (connects immediately)
  const redis1 = new Redis('redis://badhost:6379');
  
  redis1.on('error', (err) => {
    console.log('Redis error event:', err.code);
  });
  
  redis1.on('connect', () => {
    console.log('Redis connected');
  });
  
  redis1.on('ready', () => {
    console.log('Redis ready');
  });
  
  console.log('Redis instance created');
  
  // Wait to see if errors occur
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    console.log('Attempting command...');
    await redis1.ping();
    console.log('Ping succeeded');
  } catch (err: any) {
    console.log('Ping failed:', err.message);
  }
  
  redis1.disconnect();
}

// Test 2: lazyConnect behavior
async function testLazyConnect() {
  console.log('\n=== Test 2: lazyConnect behavior ===');
  
  const redis = new Redis('redis://badhost:6379', {
    lazyConnect: true,
    enableOfflineQueue: false
  });
  
  redis.on('error', (err) => {
    console.log('Redis error event:', err.code);
  });
  
  console.log('Redis instance created with lazyConnect');
  console.log('Status:', redis.status);
  
  // Wait - should not connect
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Status after 1s:', redis.status);
  
  try {
    console.log('Attempting command without connect...');
    await redis.ping();
    console.log('Ping succeeded');
  } catch (err: any) {
    console.log('Ping failed:', err.message);
  }
  
  redis.disconnect();
}

// Test 3: enableOfflineQueue behavior
async function testOfflineQueue() {
  console.log('\n=== Test 3: enableOfflineQueue behavior ===');
  
  // Test with offline queue enabled (default)
  const redis1 = new Redis('redis://badhost:6379', {
    lazyConnect: true,
    retryStrategy: () => null // Give up immediately
  });
  
  const promise1 = redis1.ping();
  console.log('Command queued with enableOfflineQueue: true');
  
  setTimeout(() => {
    console.log('Promise still pending after 2s');
  }, 2000);
  
  // Test with offline queue disabled
  const redis2 = new Redis('redis://badhost:6379', {
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null
  });
  
  try {
    const promise2 = redis2.ping();
    console.log('Command sent with enableOfflineQueue: false');
  } catch (err: any) {
    console.log('Immediate error:', err.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  redis1.disconnect();
  redis2.disconnect();
}

// Test 4: Good config behavior
async function testGoodConfig() {
  console.log('\n=== Test 4: Good config behavior ===');
  
  const redis = new Redis('redis://localhost:6379', {
    lazyConnect: true,
    enableOfflineQueue: false
  });
  
  console.log('Status before command:', redis.status);
  
  try {
    await redis.ping();
    console.log('Ping succeeded - connection was established on demand');
    console.log('Status after command:', redis.status);
  } catch (err: any) {
    console.log('Ping failed:', err.message);
  }
  
  redis.disconnect();
}

// Run tests
async function runTests() {
  try {
    await testIoRedisBasic();
    await testLazyConnect();
    await testOfflineQueue();
    await testGoodConfig();
  } catch (err) {
    console.error('Test failed:', err);
  }
  
  process.exit(0);
}

runTests();
