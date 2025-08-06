import 'dotenv/config';
// Mock the database module
jest.mock('./db', () => ({
  db: {
    execute: jest.fn().mockResolvedValue([{ result: 2 }]),
  },
}));

import { db } from './db';

describe('Database Connection', () => {
  it('should connect and run a simple query', async () => {
    // Mock the database query
    const result = await db.execute('SELECT 1+1 as result');
    expect(result).toBeDefined();
    expect(result[0]?.result).toBe(2);
    expect(db.execute).toHaveBeenCalledWith('SELECT 1+1 as result');
  });
}); 