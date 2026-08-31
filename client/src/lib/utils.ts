import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy':
    case 'active':
    case 'success':
      return 'text-green-600 bg-green-50';
    case 'degraded':
    case 'cooldown':
      return 'text-yellow-600 bg-yellow-50';
    case 'unhealthy':
    case 'invalid':
    case 'error':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}
