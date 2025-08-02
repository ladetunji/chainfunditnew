import 'dotenv/config';
import { db } from './db';

describe('Database Connection', () => {
  it('should connect and run a simple query', async () => {
    // Try a simple query; SELECT 1+1 as result
    // For Neon/Drizzle, use db.execute for raw SQL
    const result = await db.execute('SELECT 1+1 as result');
    expect(result).toBeDefined();
    // Optionally, check the value
    // expect(result[0]?.result || result.rows[0]?.result).toBe(2);
  });
}); 