import { describe, expect, it, vi, beforeEach } from 'vitest';
import { requestWithDemoFallback } from '../demoData';

describe('requestWithDemoFallback', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('throws instead of silently falling back when demo mode is off', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080');

    await expect(
      requestWithDemoFallback(
        Promise.reject(new Error('boom')),
        () => 'fallback'
      )
    ).rejects.toThrow('请求失败');
  });

  it('returns fallback only in explicit demo mode', async () => {
    localStorage.setItem('demoMode', 'true');

    await expect(
      requestWithDemoFallback(
        Promise.resolve('live'),
        () => 'fallback'
      )
    ).resolves.toBe('fallback');
  });
});
