export const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby',
  'other',
] as const;

export const REVIEW_MODES = [
  'general',
  'security',
  'performance',
  'style',
  'complexity',
] as const;

export const MODE_CONFIG = {
  general: {
    icon: '🔍',
    name: 'General',
    color: 'blue',
  },
  security: {
    icon: '🔒',
    name: 'Security',
    color: 'red',
  },
  performance: {
    icon: '⚡',
    name: 'Performance',
    color: 'orange',
  },
  style: {
    icon: '🎨',
    name: 'Style',
    color: 'purple',
  },
  complexity: {
    icon: '📊',
    name: 'Complexity',
    color: 'green',
  },
} as const;

export const API_ENDPOINTS = {
  REVIEW: '/api/review',
  REVIEW_WITH_MODE: '/api/review-with-mode',
  HISTORY: '/api/history',
  STATS: '/api/stats',
  CLEAR: '/api/clear',
  EXPORT: '/api/export',
  SUGGEST_FIX: '/api/suggest-fix',
  EXPLAIN: '/api/explain',
  COMPLEXITY: '/api/complexity',
} as const;

export const MAX_CODE_LENGTH = 10000;
export const MAX_REVIEWS_STORED = 20;
export const DEFAULT_USER_ID = 'default-user';