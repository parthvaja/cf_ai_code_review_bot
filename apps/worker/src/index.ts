export { ReviewMemory } from './models/ReviewMemory';
import { handleCORS } from './utils/cors';
import { handleReview, handleHistory, handleStats, handleClear } from './routes/review';
import { handleSuggestFix, handleExplain, handleComplexity } from './routes/ai';
import { handleExport } from './routes/export';

interface Env {
  AI: any;
  REVIEW_MEMORY: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;

    const url = new URL(request.url);

    // Review endpoints
    if (url.pathname === '/api/review' && request.method === 'POST') {
      return handleReview(request, env);
    }

    if (url.pathname === '/api/review-with-mode' && request.method === 'POST') {
      return handleReview(request, env);
    }

    if (url.pathname === '/api/history' && request.method === 'GET') {
      return handleHistory(request, env);
    }

    if (url.pathname === '/api/stats' && request.method === 'GET') {
      return handleStats(request, env);
    }

    if (url.pathname === '/api/clear' && request.method === 'DELETE') {
      return handleClear(request, env);
    }

    // AI endpoints
    if (url.pathname === '/api/suggest-fix' && request.method === 'POST') {
      return handleSuggestFix(request, env);
    }

    if (url.pathname === '/api/explain' && request.method === 'POST') {
      return handleExplain(request, env);
    }

    if (url.pathname === '/api/complexity' && request.method === 'POST') {
      return handleComplexity(request, env);
    }

    // Export endpoint
    if (url.pathname === '/api/export' && request.method === 'POST') {
      return handleExport(request);
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 404
    return new Response('Not found', { status: 404 });
  },
};