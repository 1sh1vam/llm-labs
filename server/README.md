# LLM Lab - Backend Server

Backend API for the LLM Lab experimentation platform. Run LLM experiments with different parameter combinations and evaluate responses using programmatic quality metrics.

## 🎯 Features

- **LLM Integration**: Generate responses using Groq's fast LLM API (Mixtral, LLaMA, etc.)
- **Parameter Experimentation**: Test different temperature, top_p, and max_tokens combinations
- **Quality Metrics**: 5 key programmatic metrics to evaluate response quality without using another LLM
- **Async Processing**: Non-blocking experiment execution with status tracking
- **Data Persistence**: Store experiments and responses in Firebase Firestore
- **Analytics**: Detailed metrics, correlations, and parameter impact analysis
- **Export**: Download results in JSON or CSV format
- **RESTful API**: Complete CRUD operations with validation

## 📊 Quality Metrics

The system evaluates responses using **5 key metrics**:

1. **Coherence Score** (25%) - Sentence quality, grammar, and structure
2. **Relevancy Score** (25%) - How well it addresses the prompt
3. **Completeness Score** (20%) - Response is not truncated
4. **Repetition Score** (20%) - Detects loops and stuck responses
5. **Length Score** (10%) - Appropriate response length

**Overall Score** = Weighted average of all 5 metrics

## 🏗️ Tech Stack

- **Framework**: NestJS + TypeScript
- **LLM Provider**: Groq
- **Database**: Firebase Firestore
- **Validation**: class-validator, class-transformer

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Groq API key ([Get one here](https://console.groq.com/))
- Firebase project with Firestore enabled

### Installation

1. **Install dependencies:**
```bash
npm install
```

If you encounter npm permission errors:
```bash
sudo chown -R $(whoami) ~/.npm
```

2. **Configure environment:**
```bash
# Copy template and edit with your credentials
cp ENV_TEMPLATE.md .env
```

Required environment variables:
```env
GROQ_API_KEY=gsk_your_api_key_here
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

3. **Run the server:**
```bash
# Development mode (hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Server starts at: `http://localhost:3001`

4. **Test the setup:**
```bash
curl http://localhost:3001/api/health
```

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete architecture and decisions taken
- **[API_EXAMPLES.md](./API_EXAMPLES.md)** - API endpoint examples with curl commands and responses

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/experiments` | Create new experiment |
| GET | `/api/experiments` | List all experiments (with pagination) |
| GET | `/api/experiments/:id/metrics` | Get detailed metrics and analysis |
| GET | `/api/experiments/:id/export` | Export as JSON or CSV |
| DELETE | `/api/experiments/:id` | Delete experiment |
| GET | `/api/health` | Health check |

## 🔧 Development

```bash
# Format code
npm run format

# Lint and fix
npm run lint

# Debug mode
npm run start:debug
```

## 🐛 Troubleshooting

### Firebase Connection Error
- Verify credentials in `.env`
- Check service account key path
- Ensure Firestore is enabled in Firebase console

### Groq API Error
- Verify API key is valid
- Check Groq console for rate limits
- Ensure `DEFAULT_MODEL` is supported

### Port Already in Use
```bash
lsof -ti:3001 | xargs kill -9
```

## 📊 Performance

- **Concurrent LLM calls**: 5 (configurable)
- **Max combinations per experiment**: 20
- **Average response time**: 2-3 seconds per LLM call
- **Experiment processing**: Fully asynchronous
