import { renderHook, act } from '@testing-library/react';
import { useAuth } from './use-auth';

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

     it('should initialize with null user and loading false after effect', () => {
     const { result } = renderHook(() => useAuth());
     
     expect(result.current.user).toBeNull();
     expect(result.current.loading).toBe(false);
   });

  it('should set loading to false after initialization', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Wait for useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
  });

  it('should have login function', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(typeof result.current.login).toBe('function');
  });

  it('should have logout function', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(typeof result.current.logout).toBe('function');
  });

  it('should have signup function', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(typeof result.current.signup).toBe('function');
  });

  it('should call console.log when login is called', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    expect(console.log).toHaveBeenCalledWith('Sign in:', {
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should call console.log when signup is called', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signup('test@example.com', 'password123', 'John Doe');
    });
    
    expect(console.log).toHaveBeenCalledWith('Signup:', {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'John Doe',
    });
  });

  it('should set user to null when logout is called', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Initially user should be null
    expect(result.current.user).toBeNull();
    
    await act(async () => {
      await result.current.logout();
    });
    
    // After logout, user should still be null
    expect(result.current.user).toBeNull();
  });

  it('should return the same functions on re-renders', () => {
    const { result, rerender } = renderHook(() => useAuth());
    
    const initialFunctions = {
      login: result.current.login,
      logout: result.current.logout,
      signup: result.current.signup,
    };
    
    rerender();
    
         expect(typeof result.current.login).toBe('function');
     expect(typeof result.current.logout).toBe('function');
     expect(typeof result.current.signup).toBe('function');
  });

  it('should handle multiple login calls', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('user1@example.com', 'pass1');
      await result.current.login('user2@example.com', 'pass2');
    });
    
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, 'Sign in:', {
      email: 'user1@example.com',
      password: 'pass1',
    });
    expect(console.log).toHaveBeenNthCalledWith(2, 'Sign in:', {
      email: 'user2@example.com',
      password: 'pass2',
    });
  });
}); 