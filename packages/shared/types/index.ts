// API Request/Response Types
export interface ReviewRequest {
  code: string;
  language?: string;
  userId?: string;
  mode?: ReviewMode;
}

export type ReviewMode = 'general' | 'security' | 'performance' | 'style' | 'complexity';

export interface ReviewResponse {
  review: string;
  mode: ReviewMode;
  stats: UserStats;
}

export interface ReviewRecord {
  id: string;
  code: string;
  language: string;
  review: string;
  timestamp: number;
  summary?: string;
  issues?: number;
  suggestions?: number;
  mode?: ReviewMode;
}

export interface UserStats {
  totalReviews: number;
  languagesUsed: string[];
  commonIssues: string[];
  lastReviewDate: number;
}

export interface HistoryResponse {
  reviews: ReviewRecord[];
  stats: UserStats;
}

export interface ExportRequest {
  code: string;
  review: string;
  language: string;
}

export interface FixSuggestionRequest {
  code: string;
  language: string;
  issue: string;
}

export interface FixSuggestionResponse {
  suggestion: string;
}

export interface ExplainRequest {
  code: string;
  language: string;
  question: string;
}

export interface ExplainResponse {
  explanation: string;
}

export interface ComplexityRequest {
  code: string;
  language: string;
}

export interface ComplexityResponse {
  analysis: string;
}

// API Error Response
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}