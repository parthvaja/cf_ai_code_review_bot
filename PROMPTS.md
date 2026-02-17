# AI Prompts Used in Development

This document contains all AI prompts used during the development of this project.

## Setup Phase
- "Help me set up a Cloudflare Workers AI project with Durable Objects"
- "Create project structure for code review bot"
- "Configure wrangler.toml for Workers AI and Durable Objects"

---
## Phase 2 - LLM Integration

### System Prompt for Code Review
- "You are an expert code reviewer. Provide constructive, actionable feedback on code quality, best practices, potential bugs, and performance improvements. Be specific and explain your reasoning."

### User Prompt Template
- "Review this {language} code: [code snippet]. Provide: 1. Overall assessment 2. Specific issues 3. Best practice suggestions 4. Security concerns"

### Development Prompts
- "Create TypeScript worker for Cloudflare with Workers AI Llama 3.3 integration"
- "Build code review endpoint with context awareness from previous reviews"
- "Set up Durable Objects for storing review history"

## Phase 3 - Enhanced Memory & State

### Development Prompts
- "Add user statistics tracking to Durable Objects"
- "Implement context-aware prompting with review history"
- "Create issue and suggestion counting heuristics"
- "Add stats endpoint to track user's coding patterns"

### Enhanced System Prompt
- Added user statistics context: "User Statistics: Total reviews: X, Languages used: Y, Z. Focus on patterns you've noticed in their previous code."

## Phase 4 - User Interface

### Development Prompts
- "Create modern chat interface for code review bot"
- "Build responsive UI with sidebar for stats and history"
- "Implement real-time chat experience with animations"


*More prompts will be added as development continues...*