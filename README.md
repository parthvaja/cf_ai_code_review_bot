# 🤖 AI Code Review Bot

An intelligent code review assistant powered by **Cloudflare Workers AI** (Llama 3.3), featuring context-aware reviews, persistent memory, and a beautiful chat interface.

![Code Review Bot](https://img.shields.io/badge/Cloudflare-Workers-orange) ![AI](https://img.shields.io/badge/AI-Llama%203.3-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

## 🌟 Features

- **🧠 AI-Powered Reviews**: Leverages Meta's Llama 3.3 70B model via Cloudflare Workers AI
- **💾 Persistent Memory**: Remembers your coding patterns using Durable Objects
- **📊 Smart Context**: Provides personalized suggestions based on your review history
- **🎨 Beautiful UI**: Modern, responsive chat interface with real-time updates
- **⚡ Edge Computing**: Runs globally with <50ms latency on Cloudflare's network
- **📈 Analytics**: Track your progress with statistics on languages, issues, and improvements

## 🏗️ Architecture
```
┌─────────────────┐
│   User Browser  │
│   (HTML/CSS/JS) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Cloudflare Worker      │
│  (TypeScript)           │
│  ┌─────────────────┐    │
│  │ API Endpoints   │    │
│  │ - /api/review   │    │
│  │ - /api/history  │    │
│  │ - /api/stats    │    │
│  └─────────────────┘    │
└──────┬──────────┬───────┘
       │          │
       ▼          ▼
┌──────────┐  ┌─────────────────┐
│ Workers  │  │ Durable Objects │
│ AI       │  │ (Memory/State)  │
│ (Llama)  │  │                 │
└──────────┘  └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16.13 or later
- npm or yarn
- Cloudflare account (free tier works!)
- Git

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/parthvaja/cf_ai_code_review_bot.git
   cd cf_ai_code_review_bot
```

2. **Install dependencies**
```bash
   npm install
```

3. **Login to Cloudflare**
```bash
   npx wrangler login
```

4. **Register workers.dev subdomain** (one-time setup)
   - Visit https://dash.cloudflare.com
   - Go to Workers & Pages
   - Register your workers.dev subdomain

5. **Run locally**
```bash
   npx wrangler dev
```
   
   Open http://localhost:8787 in your browser!

## 📦 Deployment

### Deploy to Cloudflare Workers
```bash
npx wrangler deploy
```

Your bot will be live at: `https://code-review-bot.<your-subdomain>.workers.dev`

### Deploy Frontend to Cloudflare Pages (Optional)

For better performance and custom domain:
```bash
npx wrangler pages deploy public --project-name=code-review-bot-ui
```

## 🎯 Usage

### Web Interface

1. Open the deployed URL or run locally
2. Select your programming language
3. Paste your code in the text area
4. Click "Get Code Review"
5. Receive instant, intelligent feedback!

### API Usage

**Review Code**
```bash
curl -X POST https://your-worker.workers.dev/api/review \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function add(a,b){return a+b}",
    "language": "javascript",
    "userId": "user123"
  }'
```

**Get History**
```bash
curl https://your-worker.workers.dev/api/history?userId=user123
```

**Get Stats**
```bash
curl https://your-worker.workers.dev/api/stats?userId=user123
```

**Clear History**
```bash
curl -X DELETE https://your-worker.workers.dev/api/clear?userId=user123
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Cloudflare Workers** | Serverless edge computing platform |
| **Workers AI** | Run Llama 3.3 70B model at the edge |
| **Durable Objects** | Persistent state and memory storage |
| **TypeScript** | Type-safe backend development |
| **HTML/CSS/JavaScript** | Interactive frontend interface |

## 📁 Project Structure
```
cf_ai_code_review_bot/
├── src/
│   ├── index.ts              # Main Worker (API endpoints)
│   └── durable-object.ts     # Memory & state management
├── public/
│   └── index.html            # Frontend UI
├── wrangler.toml             # Cloudflare configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── README.md                 # This file
└── PROMPTS.md                # AI prompts documentation
```

## 🔑 Key Components

### 1. LLM Integration (`src/index.ts`)
- Uses Cloudflare Workers AI with Llama 3.3 70B
- Context-aware prompting with review history
- Structured output for consistency

### 2. Memory System (`src/durable-object.ts`)
- Stores up to 20 recent reviews per user
- Tracks statistics (languages, issues, patterns)
- Persists data using Durable Objects storage

### 3. User Interface (`public/index.html`)
- Real-time chat experience
- Syntax highlighting for code
- Statistics dashboard
- Review history sidebar

## 🎨 Features in Detail

### Context-Aware Reviews
The bot remembers your previous code submissions and provides increasingly personalized feedback:
- Recognizes your preferred languages
- Identifies recurring issues
- Suggests improvements based on past patterns

### Smart Statistics
Track your coding journey:
- Total reviews conducted
- Languages you work with
- Common issues detected
- Review history timeline

### User Experience
- **Instant feedback**: Reviews complete in 2-5 seconds
- **Beautiful animations**: Smooth, modern interface
- **Mobile responsive**: Works on all devices
- **Keyboard shortcuts**: Shift+Enter to submit

## 🔮 Future Enhancements

Here are planned features for future iterations:

### Phase 6: Advanced Features
- [ ] **Multi-file analysis**: Review entire projects
- [ ] **Diff comparison**: Compare code versions
- [ ] **Export reports**: Download reviews as PDF/Markdown
- [ ] **Code suggestions**: Auto-fix common issues
- [ ] **Team collaboration**: Share reviews with teammates

### Phase 7: Enhanced AI
- [ ] **Custom fine-tuning**: Train on your codebase
- [ ] **Multiple AI models**: Choose between different LLMs
- [ ] **Specialized reviewers**: Security, performance, style experts
- [ ] **Learning mode**: Explain concepts interactively

### Phase 8: Integration & Automation
- [ ] **GitHub integration**: Auto-review pull requests
- [ ] **VS Code extension**: Review code in your editor
- [ ] **Slack/Discord bot**: Get reviews in chat
- [ ] **CI/CD pipeline**: Automated code quality gates

### Phase 9: Advanced Analytics
- [ ] **Code quality trends**: Track improvements over time
- [ ] **Team dashboards**: Organization-wide insights
- [ ] **Benchmarking**: Compare against best practices
- [ ] **Custom rules engine**: Define your own review criteria

### Phase 10: Voice & Accessibility
- [ ] **Voice input**: Describe code problems verbally
- [ ] **Text-to-speech**: Listen to reviews
- [ ] **Screen reader support**: Full accessibility
- [ ] **Multiple languages**: i18n support

## 🤝 Contributing

This is a showcase project for Cloudflare's internship application. If you'd like to suggest improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - feel free to use this project as inspiration for your own!

## 🙏 Acknowledgments

- **Cloudflare** for their amazing Workers AI platform
- **Meta** for the Llama 3.3 model
- **Anthropic Claude** for development assistance

## 📧 Contact

**Parth Vaja**
- GitHub: [@parthvaja](https://github.com/parthvaja)
- Email: parthmv1@umbc.edu

---

Built with ❤️ for Cloudflare's Summer 2026 Internship Application