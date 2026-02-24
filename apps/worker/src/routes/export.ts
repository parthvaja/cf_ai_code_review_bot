import type { ExportRequest, ApiError } from 'shared';
import { ExportService } from '../services/ExportService';

export async function handleExport(request: Request): Promise<Response> {
  try {
    const body = await request.json() as ExportRequest;
    const { code, review, language } = body;

    const markdown = ExportService.generateMarkdown(code, review, language);

    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="code-review-${Date.now()}.md"`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    const apiError: ApiError = { error: error.message || 'Internal server error' };
    return new Response(JSON.stringify(apiError), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}