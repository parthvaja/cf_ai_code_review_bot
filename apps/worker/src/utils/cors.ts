export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function handleCORS(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}