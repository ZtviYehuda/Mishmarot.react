import { describe, it, expect } from 'vitest';

const hashPin = async (pin: string, username: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + username);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

describe('PIN hashing', () => {
  it('produces a 64-char hex string', async () => {
    const hash = await hashPin('123456', 'user1');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('same inputs produce same hash', async () => {
    const a = await hashPin('111111', 'alice');
    const b = await hashPin('111111', 'alice');
    expect(a).toBe(b);
  });

  it('different users produce different hashes for same PIN', async () => {
    const a = await hashPin('111111', 'alice');
    const b = await hashPin('111111', 'bob');
    expect(a).not.toBe(b);
  });

  it('different PINs produce different hashes', async () => {
    const a = await hashPin('111111', 'alice');
    const b = await hashPin('222222', 'alice');
    expect(a).not.toBe(b);
  });
});
