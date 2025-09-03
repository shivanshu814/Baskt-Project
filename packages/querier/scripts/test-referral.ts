#!/usr/bin/env ts-node

/**
 * Referral System Test Runner
 *
 * Run this script to test the referral system functionality.
 *
 * Usage:
 * npm run test:referral
 * or
 * ts-node scripts/test-referral.ts
 */

import { runAllTests } from '../test/referral-system-test';

async function main() {
  console.log('🎯 Referral System Test Runner');
  console.log('================================');

  try {
    await runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

main();
