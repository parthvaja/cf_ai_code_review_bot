export { ReviewMemory } from './durable-object';

interface Env {
  AI: any;
  REVIEW_MEMORY: DurableObjectNamespace;
}

interface ReviewRequest {
  code: string;
  language?: string;
  userId?: string;
}

interface HistoryResponse {
  reviews: Array<{
    code: string;
    language: string;
    review: string;
    timestamp: number;
    summary?: string;
  }>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API endpoint: /api/review
    if (url.pathname === '/api/review' && request.method === 'POST') {
      try {
        const body = await request.json() as ReviewRequest;
        const { code, language, userId } = body;

        if (!code) {
          return new Response(JSON.stringify({ error: 'Code is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get Durable Object for this user
        const id = env.REVIEW_MEMORY.idFromName(userId || 'default-user');
        const stub = env.REVIEW_MEMORY.get(id);

        // Get conversation history
        const historyResponse = await stub.fetch('http://internal/history');
        const history = await historyResponse.json() as HistoryResponse;

        // Build context-aware prompt
        const systemPrompt = `You are an expert code reviewer. Provide constructive, actionable feedback on code quality, best practices, potential bugs, and performance improvements. Be specific and explain your reasoning.

${history.reviews?.length > 0 ? `Previous reviews context:\n${history.reviews.slice(-3).map((r) => `- Reviewed ${r.language}: ${r.summary}`).join('\n')}` : ''}`;

        const userPrompt = `Review this ${language || 'code'}:

\`\`\`${language || ''}
${code}
\`\`\`

Provide:
1. Overall assessment
2. Specific issues (if any)
3. Best practice suggestions
4. Security concerns (if any)`;

        // Call Llama 3.3 via Workers AI
        const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 1024,
        });

        const review = response.response;

        // Save review to memory
        await stub.fetch('http://internal/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            language: language || 'unknown',
            review,
            timestamp: Date.now(),
          }),
        });

        return new Response(JSON.stringify({ review }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // API endpoint: /api/history
    if (url.pathname === '/api/history' && request.method === 'GET') {
      const userId = url.searchParams.get('userId') || 'default-user';
      const id = env.REVIEW_MEMORY.idFromName(userId);
      const stub = env.REVIEW_MEMORY.get(id);

      const history = await stub.fetch('http://internal/history');
      return new Response(history.body, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Serve frontend (we'll add this in Phase 4)
    return new Response('Code Review Bot API - Use /api/review endpoint', {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  },
};