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

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.BETTER_AUTH_SECRET = 'test-better-auth-secret';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.RESEND_API_KEY = 'test-resend-api-key';
process.env.RESEND_FROM_EMAIL = 'test@example.com';
process.env.TWILIO_ACCOUNT_SID = 'test-twilio-account-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-auth-token';
process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+1234567890';
process.env.TWILIO_PHONE_NUMBER = '+1234567890';
process.env.STRIPE_SECRET_KEY = 'test-stripe-secret-key';
process.env.STRIPE_PUBLISHABLE_KEY = 'test-stripe-publishable-key';
process.env.PAYSTACK_SECRET_KEY = 'test-paystack-secret-key';
process.env.CLOUDINARY_URL = 'cloudinary://test:test@test';
process.env.OPENAI_API_KEY = 'test-openai-api-key';
process.env.QSTASH_TOKEN = 'test-qstash-token';
process.env.POSTHOG_KEY = 'test-posthog-key';
process.env.SENTRY_DSN = 'test-sentry-dsn';
process.env.DUB_CO_TOKEN = 'test-dub-co-token';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.DISCORD_CLIENT_ID = 'test-discord-client-id';
process.env.DISCORD_CLIENT_SECRET = 'test-discord-client-secret';

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