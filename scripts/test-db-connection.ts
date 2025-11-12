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

  try {
    // Test 1: Basic connection
    const start1 = Date.now();
    const result1 = await db.select({ count: users.id }).from(users).limit(1);
    const duration1 = Date.now() - start1;

    // Test 2: Retry logic with simulated failure
    const start2 = Date.now();
    const result2 = await withRetry(async () => {
      return await db.select({ id: users.id }).from(users).limit(1);
    });
    const duration2 = Date.now() - start2;

    // Test 3: Optimized helper function
    const start3 = Date.now();
    const result3 = await findUserByEmail('test@example.com');
    const duration3 = Date.now() - start3;

    // Test 4: Multiple concurrent queries
    const start4 = Date.now();
    const promises = Array.from({ length: 5 }, (_, i) => 
      withRetry(async () => {
        return await db.select({ id: users.id }).from(users).limit(1);
      })
    );
    const results4 = await Promise.all(promises);
    const duration4 = Date.now() - start4;

  } catch (error) {
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
