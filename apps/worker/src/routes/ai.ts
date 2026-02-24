import type { FixSuggestionRequest, ExplainRequest, ComplexityRequest, ApiError } from 'shared';
import { AIService } from '../services/AIService';

export async function handleSuggestFix(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as FixSuggestionRequest;
    const { code, language, issue } = body;

    const aiService = new AIService(env.AI);
    const suggestion = await aiService.suggestFix(code, language, issue);

    return jsonResponse({ suggestion });
  } catch (error: any) {
    return jsonError(error.message || 'Internal server error', 500);
  }
}

export async function handleExplain(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as ExplainRequest;
    const { code, language, question } = body;

    const aiService = new AIService(env.AI);
    const explanation = await aiService.explainCode(code, language, question);

    return jsonResponse({ explanation });
  } catch (error: any) {
    return jsonError(error.message || 'Internal server error', 500);
  }
}

export async function handleComplexity(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as ComplexityRequest;
    const { code, language } = body;

    const aiService = new AIService(env.AI);
    const analysis = await aiService.analyzeComplexity(code, language);

    return jsonResponse({ analysis });
  } catch (error: any) {
    return jsonError(error.message || 'Internal server error', 500);
  }
}

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
}