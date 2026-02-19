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

interface ReviewRecord {
  code: string;
  language: string;
  review: string;
  timestamp: number;
  summary?: string;
  issues?: number;
  suggestions?: number;
}

interface UserStats {
  totalReviews: number;
  languagesUsed: string[];
  commonIssues: string[];
  lastReviewDate: number;
}

interface HistoryResponse {
  reviews: ReviewRecord[];
  stats: UserStats;
}

interface ReviewRequest {
  code: string;
  language?: string;
  userId?: string;
  mode?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

        // Build context-aware prompt with stats
        const statsContext = history.stats.totalReviews > 0 
          ? `\nUser Statistics:
- Total reviews: ${history.stats.totalReviews}
- Languages used: ${history.stats.languagesUsed.join(', ')}
- Focus on patterns you've noticed in their previous code.`
          : '';

        const systemPrompt = `You are an expert code reviewer. Provide constructive, actionable feedback on code quality, best practices, potential bugs, and performance improvements. Be specific and explain your reasoning.
${statsContext}
${history.reviews?.length > 0 ? `\nPrevious reviews context:\n${history.reviews.slice(-3).map((r) => `- Reviewed ${r.language}: ${r.summary}`).join('\n')}` : ''}`;

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
        const saveResponse = await stub.fetch('http://internal/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            language: language || 'unknown',
            review,
            timestamp: Date.now(),
          }),
        });

        const saveData = await saveResponse.json() as { success: boolean; stats: UserStats };

        return new Response(JSON.stringify({ 
          review,
          stats: saveData.stats 
        }), {
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

    // API endpoint: /api/stats
    if (url.pathname === '/api/stats' && request.method === 'GET') {
      const userId = url.searchParams.get('userId') || 'default-user';
      const id = env.REVIEW_MEMORY.idFromName(userId);
      const stub = env.REVIEW_MEMORY.get(id);

      const historyResponse = await stub.fetch('http://internal/history');
      const history = await historyResponse.json() as HistoryResponse;

      return new Response(JSON.stringify(history.stats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // API endpoint: /api/clear (for testing)
    if (url.pathname === '/api/clear' && request.method === 'DELETE') {
      const userId = url.searchParams.get('userId') || 'default-user';
      const id = env.REVIEW_MEMORY.idFromName(userId);
      const stub = env.REVIEW_MEMORY.get(id);

      const response = await stub.fetch('http://internal/clear', {
        method: 'POST',
      });

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Serve frontend HTML
    if (url.pathname === '/' || url.pathname === '/index.html') {
      // We'll use HTMLRewriter or inline HTML
      // For now, return a simple message directing to use the deployed version
      return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Code Review Bot</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
        }
        .message {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 600px;
        }
        h1 { color: #667eea; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; margin-bottom: 15px; }
        code { background: #f5f5f5; padding: 2px 8px; border-radius: 4px; }
        .endpoint { background: #667eea; color: white; padding: 10px; border-radius: 8px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="message">
        <h1>🤖 AI Code Review Bot</h1>
        <p>API is running! Use the following endpoints:</p>
        <div class="endpoint"><code>POST /api/review</code> - Get code review</div>
        <div class="endpoint"><code>GET /api/history</code> - Get review history</div>
        <div class="endpoint"><code>GET /api/stats</code> - Get user stats</div>
        <p style="margin-top: 30px; color: #999;">Deploy to Cloudflare Pages for the full UI experience</p>
    </div>
</body>
</html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // API endpoint: /api/export (export review as markdown)
    if (url.pathname === '/api/export' && request.method === 'POST') {
      try {
        const body = await request.json() as { code: string; review: string; language: string };
        const { code, review, language } = body;

        const markdown = `# Code Review Report

          **Language**: ${language}
          **Date**: ${new Date().toLocaleString()}

          ---

          ## Original Code

          \`\`\`${language}
          ${code}
          \`\`\`

          ---

          ## Review

          ${review}

          ---

          *Generated by AI Code Review Bot powered by Cloudflare Workers AI*
          `;

        return new Response(markdown, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/markdown',
            'Content-Disposition': `attachment; filename="code-review-${Date.now()}.md"`,
          },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // API endpoint: /api/suggest-fix (AI code improvement suggestions)
    if (url.pathname === '/api/suggest-fix' && request.method === 'POST') {
      try {
        const body = await request.json() as { code: string; language: string; issue: string };
        const { code, language, issue } = body;

        const prompt = `Given this ${language} code with the issue: "${issue}"

            \`\`\`${language}
            ${code}
            \`\`\`

            Provide:
            1. A corrected version of the code
            2. Brief explanation of what was fixed
            3. Why this is better

            Format your response as:
            FIXED CODE:
            \`\`\`
            [corrected code here]
            \`\`\`

            EXPLANATION:
            [explanation here]`;

        const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [
            { role: 'system', content: 'You are an expert code fixer. Provide corrected code and clear explanations.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1024,
        });

        return new Response(JSON.stringify({ suggestion: response.response }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // API endpoint: /api/review-with-mode
    if (url.pathname === '/api/review-with-mode' && request.method === 'POST') {
      try {
        const body = await request.json() as ReviewRequest & { mode?: string };
        const { code, language, userId, mode = 'general' } = body;

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

        // Mode-specific system prompts
        const modePrompts: Record<string, string> = {
          security: `You are a security expert reviewing code for vulnerabilities. Focus on:
- SQL injection, XSS, CSRF risks
- Input validation and sanitization
- Authentication and authorization issues
- Data exposure and sensitive information handling
- Cryptography and secure communication
Be thorough and explain the security impact of each finding.`,

          performance: `You are a performance optimization expert. Focus on:
- Time complexity and algorithmic efficiency
- Memory usage and resource management
- Database query optimization
- Caching opportunities
- Bottlenecks and scalability issues
Provide specific performance metrics and optimization suggestions.`,

          style: `You are a code style and readability expert. Focus on:
- Code organization and structure
- Naming conventions and clarity
- Documentation and comments
- Design patterns and best practices
- Maintainability and refactoring opportunities
Emphasize clean code principles.`,

          complexity: `You are a code complexity analyst. Analyze:
- Cyclomatic complexity
- Code maintainability
- Function length and responsibilities
- Nesting depth and cognitive load
- Code duplication
Provide complexity scores and simplification suggestions.`,

          general: `You are an expert code reviewer. Provide balanced feedback on:
- Code quality and best practices
- Potential bugs and edge cases
- Performance considerations
- Security concerns
- Readability and maintainability`
        };

        const systemPrompt = modePrompts[mode] || modePrompts.general;

        const statsContext = history.stats.totalReviews > 0 
          ? `\nUser has ${history.stats.totalReviews} previous reviews in: ${history.stats.languagesUsed.join(', ')}`
          : '';

        const userPrompt = `Review this ${language || 'code'}:

\`\`\`${language || ''}
${code}
\`\`\`

Provide detailed analysis based on your expertise.${statsContext}`;

        // Call Llama 3.3 via Workers AI
        const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 1500,
        });

        const review = response.response;

        // Save review to memory with mode
        await stub.fetch('http://internal/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            language: language || 'unknown',
            review: `[${mode.toUpperCase()}] ${review}`,
            timestamp: Date.now(),
          }),
        });

        // Save review to memory with mode
        const saveResponse = await stub.fetch('http://internal/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            language: language || 'unknown',
            review: `[${mode.toUpperCase()}] ${review}`,
            timestamp: Date.now(),
          }),
        });

        const saveData = await saveResponse.json() as { success: boolean; stats: UserStats };

        return new Response(JSON.stringify({ 
          review,
          mode,
          stats: saveData.stats 
        }), {
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

    // API endpoint: /api/explain (Learning mode)
    if (url.pathname === '/api/explain' && request.method === 'POST') {
      try {
        const body = await request.json() as { code: string; language: string; question: string };
        const { code, language, question } = body;

        const prompt = `You are a patient coding teacher. A student is looking at this ${language} code and asks: "${question}"

\`\`\`${language || ''}
${code}
\`\`\`

Explain clearly with:
1. Direct answer to their question
2. Relevant code examples
3. Common pitfalls to avoid
4. Best practices

Keep explanations beginner-friendly but technically accurate.`;

        const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [
            { role: 'system', content: 'You are an expert programming teacher who explains concepts clearly and patiently.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1024,
        });

        return new Response(JSON.stringify({ explanation: response.response }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // API endpoint: /api/complexity (Complexity analysis)
    if (url.pathname === '/api/complexity' && request.method === 'POST') {
      try {
        const body = await request.json() as { code: string; language: string };
        const { code, language } = body;

        const prompt = `Analyze the complexity of this ${language} code and provide metrics:

\`\`\`${language || ''}
${code}
\`\`\`

Provide:
1. Cyclomatic Complexity: [1-10 score]
2. Cognitive Complexity: [1-10 score]
3. Maintainability Index: [1-100 score]
4. Lines of Code: [count]
5. Key Issues: [list main problems]
6. Refactoring Suggestions: [specific improvements]

Format as JSON-like structure for easy parsing.`;

        const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [
            { role: 'system', content: 'You are a code metrics expert. Provide accurate complexity analysis.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1024,
        });

        return new Response(JSON.stringify({ analysis: response.response }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

   // Let Cloudflare serve static assets from public/
    // This is handled automatically by the [assets] config in wrangler.toml
    return new Response('Not found', { 
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  },
};