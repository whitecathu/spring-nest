import { describe, it, expect, beforeEach } from 'vitest';
import { register, login, logout, getCurrentUser, updateProfile, getUserId } from '../services/authService';

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  } as Storage;
});

describe('authService', () => {
  describe('register', () => {
    it('should register a new user successfully', () => {
      const result = register('test@example.com', 'password123', 'testuser');
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.email).toBe('test@example.com');
      expect(result.user!.username).toBe('testuser');
    });

    it('should use email prefix as username if not provided', () => {
      const result = register('john@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(result.user!.username).toBe('john');
    });

    it('should reject invalid email format', () => {
      const result = register('invalid-email', 'password123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('邮箱格式不正确');
    });

    it('should reject password shorter than 6 characters', () => {
      const result = register('test@example.com', '12345');
      expect(result.success).toBe(false);
      expect(result.error).toContain('至少需要 6 位');
    });

    it('should reject duplicate email', () => {
      register('test@example.com', 'password123');
      const result = register('test@example.com', 'password456');
      expect(result.success).toBe(false);
      expect(result.error).toContain('已注册');
    });

    it('should auto-login after registration', () => {
      register('test@example.com', 'password123');
      const current = getCurrentUser();
      expect(current).toBeDefined();
      expect(current!.email).toBe('test@example.com');
    });

    it('should not persist plaintext local passwords', () => {
      register('test@example.com', 'password123');
      expect(store['spring_nest_users']).not.toContain('password123');
      expect(store['spring_nest_current_user']).not.toContain('password123');
    });
  });

  describe('login', () => {
    beforeEach(() => {
      register('test@example.com', 'password123', 'testuser');
      logout();
    });

    it('should login with correct credentials', () => {
      const result = login('test@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.username).toBe('testuser');
    });

    it('should reject wrong password', () => {
      const result = login('test@example.com', 'wrongpassword');
      expect(result.success).toBe(false);
      expect(result.error).toContain('邮箱或密码错误');
    });

    it('should reject non-existent email', () => {
      const result = login('nobody@example.com', 'password123');
      expect(result.success).toBe(false);
    });

    it('should persist current user after login', () => {
      login('test@example.com', 'password123');
      expect(getCurrentUser()).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should clear current user', () => {
      register('test@example.com', 'password123');
      logout();
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile fields', () => {
      register('test@example.com', 'password123', 'oldname');
      const updated = updateProfile({ username: 'newname', bio: 'hello' });
      expect(updated).toBeDefined();
      expect(updated!.username).toBe('newname');
      expect(updated!.bio).toBe('hello');
    });

    it('should reject invalid email update', () => {
      register('test@example.com', 'password123');
      const updated = updateProfile({ email: 'invalid' });
      expect(updated).toBeNull();
    });

    it('should return null when no user is logged in', () => {
      const updated = updateProfile({ username: 'x' });
      expect(updated).toBeNull();
    });
  });

  describe('getUserId', () => {
    it('should return user id when logged in', () => {
      const result = register('test@example.com', 'password123');
      const userId = getUserId();
      expect(userId).toBe(result.user!.id);
    });

    it('should return "guest" when not logged in', () => {
      expect(getUserId()).toBe('guest');
    });
  });

  describe('localStorage error recovery', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      store['spring_nest_users'] = 'not-valid-json{';
      const result = login('test@example.com', 'password123');
      expect(result.success).toBe(false);
    });

    it('should handle corrupted current user data', () => {
      store['spring_nest_current_user'] = '{broken';
      expect(getCurrentUser()).toBeNull();
    });
  });
});
