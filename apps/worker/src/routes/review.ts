import type { ReviewRequest, ReviewResponse, ApiError, HistoryResponse, UserStats } from 'shared';
import { AIService } from '../services/AIService';

export async function handleReview(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as ReviewRequest;
    const { code, language, userId, mode = 'general' } = body;

    if (!code) {
      return jsonError('Code is required', 400);
    }

    // Get Durable Object
    const id = env.REVIEW_MEMORY.idFromName(userId || 'default-user');
    const stub = env.REVIEW_MEMORY.get(id);

    // Get history for context
    const historyResponse = await stub.fetch('http://internal/history');
    const history = await historyResponse.json() as HistoryResponse;

    // Build context
    const context = history.stats.totalReviews > 0
      ? `User has ${history.stats.totalReviews} previous reviews in: ${history.stats.languagesUsed.join(', ')}`
      : undefined;

    // Review code
    const aiService = new AIService(env.AI);
    const review = await aiService.reviewCode(code, language || 'unknown', mode, context);

    // Save review
    const saveResponse = await stub.fetch('http://internal/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        language: language || 'unknown',
        review: mode !== 'general' ? `[${mode.toUpperCase()}] ${review}` : review,
        timestamp: Date.now(),
        mode,
      }),
    });

    const saveData = await saveResponse.json() as { success: boolean; stats: UserStats };

    const response: ReviewResponse = {
      review,
      mode,
      stats: saveData.stats,
    };

    return jsonResponse(response);
  } catch (error: any) {
    console.error('Review error:', error);
    return jsonError(error.message || 'Internal server error', 500);
  }
}

export async function handleHistory(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'default-user';

    const id = env.REVIEW_MEMORY.idFromName(userId);
    const stub = env.REVIEW_MEMORY.get(id);

    const history = await stub.fetch('http://internal/history');
    return new Response(history.body, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return jsonError(error.message || 'Internal server error', 500);
  }
}

export async function handleStats(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'default-user';

    const id = env.REVIEW_MEMORY.idFromName(userId);
    const stub = env.REVIEW_MEMORY.get(id);

    const historyResponse = await stub.fetch('http://internal/history');
    const history = await historyResponse.json() as HistoryResponse;

    return jsonResponse(history.stats);
  } catch (error: any) {
    return jsonError(error.message || 'Internal server error', 500);
  }
}

export async function handleClear(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'default-user';

    const id = env.REVIEW_MEMORY.idFromName(userId);
    const stub = env.REVIEW_MEMORY.get(id);

    const response = await stub.fetch('http://internal/clear', {
      method: 'POST',
    });

    return new Response(response.body, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return jsonError(error.message || 'Internal server error', 500);
  }
}

// Helper functions
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function jsonError(message: string, status = 400): Response {
  const error: ApiError = { error: message };
  return jsonResponse(error, status);
}

interface Env {
  AI: any;
  REVIEW_MEMORY: DurableObjectNamespace;
}