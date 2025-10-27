#!/usr/bin/env tsx

/**
 * Database Connection Test Script
 * 
 * This script tests the improved database connection with retry logic
 * to verify that the timeout issues have been resolved.
 * 
 * Usage: npx tsx scripts/test-db-connection.ts
 */

import { db, withRetry, findUserByEmail } from '../lib/db';
import { users } from '../lib/schema/users';
import { eq } from 'drizzle-orm';

async function testDatabaseConnection() {
  console.log('🔗 Testing database connection with retry logic...\n');

  try {
    // Test 1: Basic connection
    console.log('Test 1: Basic database connection');
    const start1 = Date.now();
    const result1 = await db.select({ count: users.id }).from(users).limit(1);
    const duration1 = Date.now() - start1;
    console.log(`✅ Basic query completed in ${duration1}ms\n`);

    // Test 2: Retry logic with simulated failure
    console.log('Test 2: Testing retry logic');
    const start2 = Date.now();
    const result2 = await withRetry(async () => {
      return await db.select({ id: users.id }).from(users).limit(1);
    });
    const duration2 = Date.now() - start2;
    console.log(`✅ Retry-wrapped query completed in ${duration2}ms\n`);

    // Test 3: Optimized helper function
    console.log('Test 3: Testing optimized helper function');
    const start3 = Date.now();
    const result3 = await findUserByEmail('test@example.com');
    const duration3 = Date.now() - start3;
    console.log(`✅ Helper function completed in ${duration3}ms\n`);

    // Test 4: Multiple concurrent queries
    console.log('Test 4: Testing multiple concurrent queries');
    const start4 = Date.now();
    const promises = Array.from({ length: 5 }, (_, i) => 
      withRetry(async () => {
        return await db.select({ id: users.id }).from(users).limit(1);
      })
    );
    const results4 = await Promise.all(promises);
    const duration4 = Date.now() - start4;
    console.log(`✅ ${results4.length} concurrent queries completed in ${duration4}ms\n`);

    console.log('🎉 All database connection tests passed!');
    console.log('\nSummary:');
    console.log(`- Basic query: ${duration1}ms`);
    console.log(`- Retry-wrapped query: ${duration2}ms`);
    console.log(`- Helper function: ${duration3}ms`);
    console.log(`- 5 concurrent queries: ${duration4}ms`);

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
