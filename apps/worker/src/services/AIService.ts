import type { ReviewMode } from 'packages/shared/types/index.ts';

export class AIService {
  constructor(private ai: any) {}

  async reviewCode(
    code: string,
    language: string,
    mode: ReviewMode = 'general',
    context?: string
  ): Promise<string> {
    const systemPrompt = this.getSystemPrompt(mode, context);
    const userPrompt = this.getUserPrompt(code, language);

    const response = await this.ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
    });

    return response.response;
  }

  async suggestFix(code: string, language: string, issue: string): Promise<string> {
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

    const response = await this.ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: 'You are an expert code fixer. Provide corrected code and clear explanations.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
    });

    return response.response;
  }

  async explainCode(code: string, language: string, question: string): Promise<string> {
    const prompt = `You are a patient coding teacher. A student is looking at this ${language} code and asks: "${question}"

\`\`\`${language}
${code}
\`\`\`

Explain clearly with:
1. Direct answer to their question
2. Relevant code examples
3. Common pitfalls to avoid
4. Best practices

Keep explanations beginner-friendly but technically accurate.`;

    const response = await this.ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: 'You are an expert programming teacher who explains concepts clearly and patiently.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
    });

    return response.response;
  }

  async analyzeComplexity(code: string, language: string): Promise<string> {
    const prompt = `Analyze the complexity of this ${language} code and provide metrics:

\`\`\`${language}
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

    const response = await this.ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: 'You are a code metrics expert. Provide accurate complexity analysis.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
    });

    return response.response;
  }

  private getSystemPrompt(mode: ReviewMode, context?: string): string {
    const modePrompts: Record<ReviewMode, string> = {
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
- Readability and maintainability`,
    };

    let prompt = modePrompts[mode];
    if (context) {
      prompt += `\n\n${context}`;
    }

    return prompt;
  }

  private getUserPrompt(code: string, language: string): string {
    return `Review this ${language || 'code'}:

\`\`\`${language || ''}
${code}
\`\`\`

Provide:
1. Overall assessment
2. Specific issues (if any)
3. Best practice suggestions
4. Security concerns (if any)`;
  }
}