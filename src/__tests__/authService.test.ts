import { describe, it, expect, beforeEach } from 'vitest';
import {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  getUserId,
} from '../services/authService';

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  } as Storage;
});

describe('authService', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await register('test@example.com', 'password123', 'testuser');
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.email).toBe('test@example.com');
      expect(result.user!.username).toBe('testuser');
    });

    it('should use email prefix as username if not provided', async () => {
      const result = await register('john@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(result.user!.username).toBe('john');
    });

    it('should reject invalid email format', async () => {
      const result = await register('invalid-email', 'password123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('邮箱格式不正确');
    });

    it('should reject password shorter than 8 characters', async () => {
      const result = await register('test@example.com', '1234567');
      expect(result.success).toBe(false);
      expect(result.error).toContain('至少需要 8 位');
    });

    it('should reject duplicate email', async () => {
      await register('test@example.com', 'password123');
      const result = await register('test@example.com', 'password456');
      expect(result.success).toBe(false);
      expect(result.error).toContain('已注册');
    });

    it('should auto-login after registration', async () => {
      await register('test@example.com', 'password123');
      const current = getCurrentUser();
      expect(current).toBeDefined();
      expect(current!.email).toBe('test@example.com');
    });

    it('should not persist plaintext local passwords', async () => {
      await register('test@example.com', 'password123');
      expect(store['spring_nest_users']).not.toContain('password123');
      expect(store['spring_nest_current_user']).not.toContain('password123');
      expect(store['spring_nest_users']).toContain('local-v2:');
    });

    it('normalizes email casing and surrounding whitespace', async () => {
      const result = await register('  Test.User@Example.COM  ', 'password123', 'tester');
      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('test.user@example.com');
    });

    it('treats differently-cased emails as the same account', async () => {
      await register('test@example.com', 'password123', 'tester');
      const result = await register(' TEST@EXAMPLE.COM ', 'password456', 'other');
      expect(result.success).toBe(false);
      expect(result.error).toContain('已注册');
    });

    it('enforces account field length limits', async () => {
      const longEmail = `${'a'.repeat(243)}@example.com`;
      const emailResult = await register(longEmail, 'password123', 'tester');
      const passwordResult = await register('password@example.com', 'x'.repeat(129), 'tester');
      const shortNameResult = await register('short@example.com', 'password123', 'x');
      const longNameResult = await register('long@example.com', 'password123', 'x'.repeat(51));

      expect(emailResult.success).toBe(false);
      expect(passwordResult.success).toBe(false);
      expect(shortNameResult.success).toBe(false);
      expect(longNameResult.success).toBe(false);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await register('test@example.com', 'password123', 'testuser');
      logout();
    });

    it('should login with correct credentials', async () => {
      const result = await login('test@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.username).toBe('testuser');
    });

    it('should reject wrong password', async () => {
      const result = await login('test@example.com', 'wrongpassword');
      expect(result.success).toBe(false);
      expect(result.error).toContain('邮箱或密码错误');
    });

    it('should reject non-existent email', async () => {
      const result = await login('nobody@example.com', 'password123');
      expect(result.success).toBe(false);
    });

    it('should persist current user after login', async () => {
      await login('test@example.com', 'password123');
      expect(getCurrentUser()).toBeDefined();
    });

    it('should migrate legacy plaintext records on login', async () => {
      store['spring_nest_users'] = JSON.stringify([
        {
          id: 'u_legacy',
          email: 'legacy@example.com',
          username: 'legacy',
          password: 'password123',
          bio: '',
          createdAt: new Date().toISOString(),
        },
      ]);
      const result = await login('legacy@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(store['spring_nest_users']).toContain('local-v2:');
      expect(store['spring_nest_users']).not.toContain('"password":"password123"');
    });

    it('normalizes email before looking up the account', async () => {
      const result = await login('  TEST@EXAMPLE.COM ', 'password123');
      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('test@example.com');
    });
  });

  describe('logout', () => {
    it('should clear current user', async () => {
      await register('test@example.com', 'password123');
      logout();
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile fields', async () => {
      await register('test@example.com', 'password123', 'oldname');
      const result = await updateProfile({ username: 'newname', bio: 'hello' });
      expect(result.success).toBe(true);
      expect(result.user?.username).toBe('newname');
      expect(result.user?.bio).toBe('hello');
      expect(result.emailConfirmationPending).toBe(false);
    });

    it('should reject invalid email update', async () => {
      await register('test@example.com', 'password123');
      const result = await updateProfile({ email: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should return an error when no user is logged in', async () => {
      const result = await updateProfile({ username: 'valid-name' });
      expect(result.success).toBe(false);
    });

    it('rejects an oversized bio without mutating the current user', async () => {
      await register('test@example.com', 'password123', 'oldname');
      const result = await updateProfile({ bio: 'x'.repeat(501) });

      expect(result.success).toBe(false);
      expect(getCurrentUser()?.bio).toBe('');
    });
  });

  describe('getUserId', () => {
    it('should return user id when logged in', async () => {
      const result = await register('test@example.com', 'password123');
      const userId = getUserId();
      expect(userId).toBe(result.user!.id);
    });

    it('should return "guest" when not logged in', () => {
      expect(getUserId()).toBe('guest');
    });
  });

  describe('localStorage error recovery', () => {
    it('should handle corrupted localStorage data gracefully', async () => {
      store['spring_nest_users'] = 'not-valid-json{';
      const result = await login('test@example.com', 'password123');
      expect(result.success).toBe(false);
    });

    it('should handle corrupted current user data', () => {
      store['spring_nest_current_user'] = '{broken';
      expect(getCurrentUser()).toBeNull();
    });
  });
});
