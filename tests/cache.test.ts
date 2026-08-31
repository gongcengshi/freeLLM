import { describe, it, expect, beforeEach } from 'vitest';
import { RequestCache } from '../src/utils/cache.js';

describe('RequestCache', () => {
  let cache: RequestCache;

  beforeEach(() => {
    cache = new RequestCache({ ttlMs: 1000, maxSize: 10 });
  });

  it('should store and retrieve values', () => {
    cache.set('key1', { data: 'value1' });
    const result = cache.get('key1');
    expect(result).toEqual({ data: 'value1' });
  });

  it('should return null for non-existent keys', () => {
    const result = cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should expire entries after TTL', async () => {
    cache.set('key1', { data: 'value1' }, 100); // 100ms TTL
    expect(cache.get('key1')).toEqual({ data: 'value1' });
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(cache.get('key1')).toBeNull();
  });

  it('should respect max size', () => {
    for (let i = 0; i < 15; i++) {
      cache.set(`key${i}`, { data: `value${i}` });
    }
    expect(cache.size).toBeLessThanOrEqual(10);
  });

  it('should delete entries', () => {
    cache.set('key1', { data: 'value1' });
    cache.delete('key1');
    expect(cache.get('key1')).toBeNull();
  });

  it('should clear all entries', () => {
    cache.set('key1', { data: 'value1' });
    cache.set('key2', { data: 'value2' });
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('should cleanup expired entries', async () => {
    cache.set('key1', { data: 'value1' }, 50);
    cache.set('key2', { data: 'value2' }, 200);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    const removed = cache.cleanup();
    expect(removed).toBe(1);
    expect(cache.size).toBe(1);
  });
});
