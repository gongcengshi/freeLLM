import type { RoutingStrategy, ModelScore } from '../types/index.js';
import { getAllModelScores } from '../db/modelScores.js';

export interface RouterCandidate {
  providerId: string;
  modelId: string;
  apiKeyId: string;
  apiKey: string;
}

export class RouterEngine {
  private roundRobinIndex: Map<string, number> = new Map();

  selectCandidate(
    candidates: RouterCandidate[],
    strategy: RoutingStrategy,
    _requestedModel?: string
  ): RouterCandidate | null {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    switch (strategy) {
      case 'priority':
        return this.selectByPriority(candidates);
      case 'balanced':
        return this.selectBalanced(candidates);
      case 'fastest':
        return this.selectFastest(candidates);
      case 'smartest':
        return this.selectSmartest(candidates);
      case 'cheapest':
        return this.selectCheapest(candidates);
      case 'random':
        return this.selectRandom(candidates);
      case 'round-robin':
        return this.selectRoundRobin(candidates);
      default:
        return this.selectByPriority(candidates);
    }
  }

  private selectByPriority(candidates: RouterCandidate[]): RouterCandidate {
    // Sort by provider priority (order of preference)
    const priorityOrder = ['groq', 'nvidia', 'deepseek', 'google', 'openrouter'];
    return candidates.sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a.providerId);
      const bIdx = priorityOrder.indexOf(b.providerId);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    })[0];
  }

  private selectBalanced(candidates: RouterCandidate[]): RouterCandidate {
    const scores = getAllModelScores();
    const scoreMap = new Map<string, ModelScore>();
    for (const score of scores) {
      scoreMap.set(`${score.providerId}/${score.modelId}`, score);
    }

    return candidates.sort((a, b) => {
      const aScore = scoreMap.get(`${a.providerId}/${a.modelId}`)?.totalScore || 50;
      const bScore = scoreMap.get(`${b.providerId}/${b.modelId}`)?.totalScore || 50;
      return bScore - aScore;
    })[0];
  }

  private selectFastest(candidates: RouterCandidate[]): RouterCandidate {
    const scores = getAllModelScores();
    const scoreMap = new Map<string, ModelScore>();
    for (const score of scores) {
      scoreMap.set(`${score.providerId}/${score.modelId}`, score);
    }

    return candidates.sort((a, b) => {
      const aSpeed = scoreMap.get(`${a.providerId}/${a.modelId}`)?.speed || 50;
      const bSpeed = scoreMap.get(`${b.providerId}/${b.modelId}`)?.speed || 50;
      return bSpeed - aSpeed;
    })[0];
  }

  private selectSmartest(candidates: RouterCandidate[]): RouterCandidate {
    const scores = getAllModelScores();
    const scoreMap = new Map<string, ModelScore>();
    for (const score of scores) {
      scoreMap.set(`${score.providerId}/${score.modelId}`, score);
    }

    return candidates.sort((a, b) => {
      const aQuality = scoreMap.get(`${a.providerId}/${a.modelId}`)?.quality || 50;
      const bQuality = scoreMap.get(`${b.providerId}/${b.modelId}`)?.quality || 50;
      return bQuality - aQuality;
    })[0];
  }

  private selectCheapest(candidates: RouterCandidate[]): RouterCandidate {
    // All free providers, just pick randomly
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private selectRandom(candidates: RouterCandidate[]): RouterCandidate {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private selectRoundRobin(candidates: RouterCandidate[]): RouterCandidate {
    const key = candidates.map(c => c.providerId).join(',');
    const index = this.roundRobinIndex.get(key) || 0;
    const selected = candidates[index % candidates.length];
    this.roundRobinIndex.set(key, (index + 1) % candidates.length);
    return selected;
  }
}

export const routerEngine = new RouterEngine();
