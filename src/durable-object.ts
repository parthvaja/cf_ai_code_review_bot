interface ReviewRecord {
  code: string;
  language: string;
  review: string;
  timestamp: number;
  summary?: string;
}

interface SaveRequest {
  code: string;
  language: string;
  review: string;
  timestamp: number;
}

export class ReviewMemory {
  private state: DurableObjectState;
  private reviews: ReviewRecord[] = [];

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Initialize from storage
    if (this.reviews.length === 0) {
      const stored = await this.state.storage.get<ReviewRecord[]>('reviews');
      this.reviews = stored || [];
    }

    // Get history
    if (url.pathname === '/history') {
      return new Response(JSON.stringify({ reviews: this.reviews }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save new review
    if (url.pathname === '/save' && request.method === 'POST') {
      const data = await request.json() as SaveRequest;
      
      // Create summary for context
      const summary = data.review.substring(0, 100) + '...';
      
      this.reviews.push({
        ...data,
        summary,
      });

      // Keep only last 20 reviews
      if (this.reviews.length > 20) {
        this.reviews = this.reviews.slice(-20);
      }

      // Persist to storage
      await this.state.storage.put('reviews', this.reviews);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}