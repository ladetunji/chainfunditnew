import { generateUserJWT, verifyUserJWT } from './auth';

// Mock better-auth
jest.mock('better-auth', () => ({
  betterAuth: jest.fn(() => ({})),
}));

// Mock drizzle adapter
jest.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: jest.fn(() => ({})),
}));

// Mock database
jest.mock('./db', () => ({
  db: {},
}));

describe('JWT Functions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateUserJWT', () => {
    it('should generate a valid JWT token', () => {
      const user = { id: 'user123', email: 'test@example.com' };
      const token = generateUserJWT(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should use custom JWT secret when provided', () => {
      process.env.JWT_SECRET = 'custom-secret';
      const user = { id: 'user123', email: 'test@example.com' };
      const token = generateUserJWT(user);
      
      expect(token).toBeDefined();
    });

    it('should use default secret when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      const user = { id: 'user123', email: 'test@example.com' };
      const token = generateUserJWT(user);
      
      expect(token).toBeDefined();
    });

    it('should include user data in token payload', () => {
      const user = { id: 'user123', email: 'test@example.com' };
      const token = generateUserJWT(user);
      
      // Decode the token (without verification) to check payload
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      expect(payload.sub).toBe('user123');
      expect(payload.email).toBe('test@example.com');
    });
  });

  describe('verifyUserJWT', () => {
    it('should verify a valid JWT token', () => {
      const user = { id: 'user123', email: 'test@example.com' };
      const token = generateUserJWT(user);
      const decoded = verifyUserJWT(token);
      
      expect(decoded).toMatchObject({
        sub: 'user123',
        email: 'test@example.com',
      });
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
    });

    it('should return null for invalid token', () => {
      const result = verifyUserJWT('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      const result = verifyUserJWT('not.a.valid.jwt');
      expect(result).toBeNull();
    });

    it('should return null for empty token', () => {
      const result = verifyUserJWT('');
      expect(result).toBeNull();
    });

    it('should handle tokens with different secret', () => {
      const user = { id: 'user123', email: 'test@example.com' };
      process.env.JWT_SECRET = 'secret1';
      const token = generateUserJWT(user);
      
      process.env.JWT_SECRET = 'secret2';
      const result = verifyUserJWT(token);
      expect(result).toBeNull();
    });

    it('should handle expired tokens', () => {
      // Create a token with very short expiration
      const user = { id: 'user123', email: 'test@example.com' };
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'test-secret';
      
      // Mock jwt.sign to create an expired token
      const jwt = require('jsonwebtoken');
      const originalSign = jwt.sign;
      jwt.sign = jest.fn((payload, secret, options) => {
        return originalSign(payload, secret, { ...options, expiresIn: '0s' });
      });
      
      const token = generateUserJWT(user);
      
      // Restore original function
      jwt.sign = originalSign;
      process.env.JWT_SECRET = originalSecret;
      
      const result = verifyUserJWT(token);
      expect(result).toBeNull();
    });
  });

  describe('Token round-trip', () => {
    it('should be able to generate and verify the same token', () => {
      const user = { id: 'user123', email: 'test@example.com' };
      const token = generateUserJWT(user);
      const decoded = verifyUserJWT(token);
      
      expect(decoded).toMatchObject({
        sub: user.id,
        email: user.email,
      });
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
    });
  });
}); 