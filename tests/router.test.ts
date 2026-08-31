import { describe, it, expect, beforeEach } from 'vitest';
import { RouterEngine, type RouterCandidate } from '../src/router/engine.js';

describe('RouterEngine', () => {
  let engine: RouterEngine;
  let candidates: RouterCandidate[];

  beforeEach(() => {
    engine = new RouterEngine();
    candidates = [
      { providerId: 'groq', modelId: 'llama-3.3-70b', apiKeyId: 'key1', apiKey: 'test1' },
      { providerId: 'google', modelId: 'gemini-2.0-flash', apiKeyId: 'key2', apiKey: 'test2' },
      { providerId: 'nvidia', modelId: 'llama-3.3-70b', apiKeyId: 'key3', apiKey: 'test3' },
    ];
  });

  it('should return null for empty candidates', () => {
    const result = engine.selectCandidate([], 'priority');
    expect(result).toBeNull();
  });

  it('should return single candidate', () => {
    const result = engine.selectCandidate([candidates[0]], 'priority');
    expect(result).toBe(candidates[0]);
  });

  it('should select by priority strategy', () => {
    const result = engine.selectCandidate(candidates, 'priority');
    expect(result?.providerId).toBe('groq'); // First in priority list
  });

  it('should select randomly', () => {
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const result = engine.selectCandidate(candidates, 'random');
      results.add(result?.providerId || '');
    }
    // Should have selected multiple different providers
    expect(results.size).toBeGreaterThan(1);
  });

  it('should round-robin through candidates', () => {
    const first = engine.selectCandidate(candidates, 'round-robin');
    const second = engine.selectCandidate(candidates, 'round-robin');
    const third = engine.selectCandidate(candidates, 'round-robin');
    const fourth = engine.selectCandidate(candidates, 'round-robin');
    
    // Should cycle through candidates
    expect(first?.providerId).not.toBe(second?.providerId);
    expect(second?.providerId).not.toBe(third?.providerId);
    expect(third?.providerId).not.toBe(fourth?.providerId);
  });
});
