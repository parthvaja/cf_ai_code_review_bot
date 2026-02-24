interface ReviewRecord {
  code: string;
  language: string;
  review: string;
  timestamp: number;
  summary?: string;
  issues?: number;
  suggestions?: number;
}

interface SaveRequest {
  code: string;
  language: string;
  review: string;
  timestamp: number;
}

interface UserStats {
  totalReviews: number;
  languagesUsed: string[];
  commonIssues: string[];
  lastReviewDate: number;
}

export class ReviewMemory {
  private state: DurableObjectState;
  private reviews: ReviewRecord[] = [];
  private stats: UserStats = {
    totalReviews: 0,
    languagesUsed: [],
    commonIssues: [],  // ← ADD THIS
    lastReviewDate: 0,
  };

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Initialize from storage
    if (this.reviews.length === 0) {
      const stored = await this.state.storage.get<ReviewRecord[]>('reviews');
      const storedStats = await this.state.storage.get<UserStats>('stats');
      this.reviews = stored || [];
      this.stats = storedStats || {
        totalReviews: 0,
        languagesUsed: [],
        commonIssues: [],  // ← ADD THIS
        lastReviewDate: 0,
      };
    }

    // Get history
    if (url.pathname === '/history') {
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

    // Save new review
    if (url.pathname === '/save' && request.method === 'POST') {
      const data = await request.json() as SaveRequest;
      
      // Create summary for context
      const summary = data.review.substring(0, 100) + '...';
      
      // Extract issue and suggestion counts (simple heuristic)
      const issues = (data.review.match(/issue|problem|bug|error|wrong/gi) || []).length;
      const suggestions = (data.review.match(/suggest|recommend|consider|should|could/gi) || []).length;
      
      // Extract common issues (simple keyword extraction)
      const issueKeywords = data.review.toLowerCase().match(/\b(security|performance|readability|maintainability|error handling|validation)\b/g) || [];
      issueKeywords.forEach(keyword => {
        if (!this.stats.commonIssues.includes(keyword)) {
          this.stats.commonIssues.push(keyword);
        }
      });
      
      this.reviews.push({
        ...data,
        summary,
        issues,
        suggestions,
      });

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

      // Persist to storage
      await this.state.storage.put('reviews', this.reviews);
      await this.state.storage.put('stats', this.stats);

      return new Response(JSON.stringify({ success: true, stats: this.stats }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clear history (useful for testing)
    if (url.pathname === '/clear' && request.method === 'POST') {
      this.reviews = [];
      this.stats = {
        totalReviews: 0,
        languagesUsed: [],
        commonIssues: [],  // ← ADD THIS
        lastReviewDate: 0,
      };
      
      await this.state.storage.delete('reviews');
      await this.state.storage.delete('stats');
      
      return new Response(JSON.stringify({ success: true, message: 'History cleared' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}