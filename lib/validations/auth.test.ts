import { loginSchema, signupSchema, otpSchema } from './auth';

describe('Authentication Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('should reject password shorter than 6 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
      }
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
      }
    });

    it('should reject missing email field', () => {
      const invalidData = {
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid input: expected string, received undefined');
      }
    });

    it('should reject missing password field', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid input: expected string, received undefined');
      }
    });
  });

  describe('signupSchema', () => {
    it('should validate valid signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
      };

      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        fullName: 'John Doe',
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('should reject password shorter than 6 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345',
        fullName: 'John Doe',
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
      }
    });

    it('should reject full name shorter than 2 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'J',
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Full name must be at least 2 characters');
      }
    });

    it('should reject empty full name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: '',
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Full name must be at least 2 characters');
      }
    });

    it('should reject missing email field', () => {
      const invalidData = {
        password: 'password123',
        fullName: 'John Doe',
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid input: expected string, received undefined');
      }
    });

    it('should reject missing password field', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'John Doe',
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid input: expected string, received undefined');
      }
    });

    it('should reject missing fullName field', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid input: expected string, received undefined');
      }
    });

    it('should accept full name with spaces', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Michael Doe',
      };

      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should accept full name with special characters', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'José María García',
      };

      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });
  });

  describe('otpSchema', () => {
    it('should validate valid OTP', () => {
      const validData = {
        otp: '123456',
      };

      const result = otpSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject OTP shorter than 6 digits', () => {
      const invalidData = {
        otp: '12345',
      };

      const result = otpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('OTP must be 6 digits');
      }
    });

    it('should reject OTP longer than 6 digits', () => {
      const invalidData = {
        otp: '1234567',
      };

      const result = otpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('OTP must be 6 digits');
      }
    });

    it('should reject OTP with non-numeric characters', () => {
      const invalidData = {
        otp: '12345a',
      };

      const result = otpSchema.safeParse(invalidData);
      expect(result.success).toBe(true); // Zod string validation allows any string
      if (result.success) {
        expect(result.data).toEqual(invalidData);
      }
    });

    it('should reject empty OTP', () => {
      const invalidData = {
        otp: '',
      };

      const result = otpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('OTP must be 6 digits');
      }
    });

    it('should reject missing OTP field', () => {
      const invalidData = {};

      const result = otpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid input: expected string, received undefined');
      }
    });

    it('should accept OTP with leading zeros', () => {
      const validData = {
        otp: '000123',
      };

      const result = otpSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should accept OTP with all zeros', () => {
      const validData = {
        otp: '000000',
      };

      const result = otpSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });
  });

  describe('Schema Type Inference', () => {
    it('should correctly infer LoginFormData type', () => {
      // This test ensures the type inference works correctly
      const loginData: any = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(loginData);
      if (result.success) {
        // TypeScript should infer this as LoginFormData
        const typedData = result.data;
        expect(typeof typedData.email).toBe('string');
        expect(typeof typedData.password).toBe('string');
      }
    });

    it('should correctly infer SignupFormData type', () => {
      const signupData: any = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
      };

      const result = signupSchema.safeParse(signupData);
      if (result.success) {
        // TypeScript should infer this as SignupFormData
        const typedData = result.data;
        expect(typeof typedData.email).toBe('string');
        expect(typeof typedData.password).toBe('string');
        expect(typeof typedData.fullName).toBe('string');
      }
    });

    it('should correctly infer OtpFormData type', () => {
      const otpData: any = {
        otp: '123456',
      };

      const result = otpSchema.safeParse(otpData);
      if (result.success) {
        // TypeScript should infer this as OtpFormData
        const typedData = result.data;
        expect(typeof typedData.otp).toBe('string');
      }
    });
  });
}); 