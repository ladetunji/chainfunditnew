require('@testing-library/jest-dom');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return require('react').createElement('img', props);
  },
}));

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.BETTER_AUTH_SECRET = 'test-auth-secret';
process.env.DUB_CO_TOKEN = 'test-dub-token';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.FACEBOOK_CLIENT_ID = 'test-facebook-client-id';
process.env.FACEBOOK_CLIENT_SECRET = 'test-facebook-client-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock FormData
global.FormData = class FormData {
  append(key, value) {}
  get(key) { return null; }
  has(key) { return false; }
  delete(key) {}
  set(key, value) {}
  entries() { return []; }
  keys() { return []; }
  values() { return []; }
  forEach(callback) {}
};

// Mock TextDecoder and TextEncoder for database tests
global.TextDecoder = class TextDecoder {
  constructor(encoding = 'utf-8') {}
  decode(input) { return ''; }
};

global.TextEncoder = class TextEncoder {
  encode(input) { return new Uint8Array(); }
}; 