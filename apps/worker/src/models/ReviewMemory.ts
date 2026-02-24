import type { ReviewRecord, UserStats } from 'shared';

export class ReviewMemory {
  private state: DurableObjectState;
  private reviews: ReviewRecord[] = [];
  private stats: UserStats = {
    totalReviews: 0,
    languagesUsed: [],
    commonIssues: [],
    lastReviewDate: 0,
  };

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Initialize from storage
    await this.initialize();

    // Route handlers
    if (url.pathname === '/history') {
      return this.getHistory();
    }

    if (url.pathname === '/save' && request.method === 'POST') {
      return this.saveReview(request);
    }

    if (url.pathname === '/clear' && request.method === 'POST') {
      return this.clearHistory();
    }

    return new Response('Not found', { status: 404 });
  }

  private async initialize(): Promise<void> {
    if (this.reviews.length === 0) {
      const stored = await this.state.storage.get<ReviewRecord[]>('reviews');
      const storedStats = await this.state.storage.get<UserStats>('stats');
      
      this.reviews = stored || [];
      this.stats = storedStats || {
        totalReviews: 0,
        languagesUsed: [],
        commonIssues: [],
        lastReviewDate: 0,
      };
    }
  }

  private getHistory(): Response {
    return new Response(
      JSON.stringify({ 
        reviews: this.reviews,
        stats: this.stats 
      }), 
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  private async saveReview(request: Request): Promise<Response> {
    const data = await request.json() as Omit<ReviewRecord, 'id' | 'summary' | 'issues' | 'suggestions'>;
    
    // Generate ID
    const id = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create summary
    const summary = data.review.substring(0, 100) + '...';
    
    // Extract issue and suggestion counts
    const issues = (data.review.match(/issue|problem|bug|error|wrong/gi) || []).length;
    const suggestions = (data.review.match(/suggest|recommend|consider|should|could/gi) || []).length;
    
    // Extract common issues
    const issueKeywords = data.review.toLowerCase().match(/\b(security|performance|readability|maintainability|error handling|validation)\b/g) || [];
    issueKeywords.forEach(keyword => {
      if (!this.stats.commonIssues.includes(keyword)) {
        this.stats.commonIssues.push(keyword);
      }
    });
    
    const review: ReviewRecord = {
      id,
      ...data,
      summary,
      issues,
      suggestions,
    };
    
    this.reviews.push(review);

    // Update stats
    this.stats.totalReviews++;
    this.stats.lastReviewDate = data.timestamp;
    
    if (!this.stats.languagesUsed.includes(data.language)) {
      this.stats.languagesUsed.push(data.language);
    }

    // Keep only last 20 reviews
    if (this.reviews.length > 20) {
      this.reviews = this.reviews.slice(-20);
    }

    // Persist
    await this.state.storage.put('reviews', this.reviews);
    await this.state.storage.put('stats', this.stats);

    return new Response(JSON.stringify({ success: true, stats: this.stats }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async clearHistory(): Promise<Response> {
    this.reviews = [];
    this.stats = {
      totalReviews: 0,
      languagesUsed: [],
      commonIssues: [],
      lastReviewDate: 0,
    };
    
    await this.state.storage.delete('reviews');
    await this.state.storage.delete('stats');
    
    return new Response(JSON.stringify({ success: true, message: 'History cleared' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}