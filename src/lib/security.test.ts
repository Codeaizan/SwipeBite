import { describe, expect, it } from 'vitest';
import { generateStrongPassword } from './security';

describe('generateStrongPassword', () => {
  it('creates a password with the requested length', () => {
    const password = generateStrongPassword(20);
    expect(password).toHaveLength(20);
  });

  it('includes only allowed characters', () => {
    const password = generateStrongPassword(64);
    expect(password).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*+\-_=.?]+$/);
  });

  it('generates different values across calls', () => {
    const first = generateStrongPassword(24);
    const second = generateStrongPassword(24);
    expect(first).not.toBe(second);
  });
});
