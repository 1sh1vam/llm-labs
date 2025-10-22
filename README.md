# 🧪 LLM Lab

A full-stack experimentation platform for testing and comparing LLM responses across different parameter combinations. Run experiments with various temperature and top-p values, evaluate responses using programmatic quality metrics, and analyze results through an intuitive interface.

## 🎯 Overview

LLM Lab helps you understand how different parameters affect LLM outputs by:
- Running experiments with multiple parameter combinations (temperature × top-p)
- Evaluating responses using 5 programmatic quality metrics
- Comparing results side-by-side with detailed analytics
- Exporting data for further analysis

## 🚀 Quick Start

Get both the backend and frontend running in under 5 minutes!

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Groq API Key** ([Get free key](https://console.groq.com/))
- **Firebase Project** with Firestore enabled ([Firebase Console](https://console.firebase.google.com/))

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd llm-lab
```

### 2. Setup Backend (Terminal 1)

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp ENV_TEMPLATE.md .env

# Edit .env and add your credentials:
# - GROQ_API_KEY
# - FIREBASE_PROJECT_ID
# - FIREBASE_CLIENT_EMAIL
# - FIREBASE_PRIVATE_KEY

# Start the server
npm run start:dev
```

Backend will be available at `http://localhost:3001`

### 3. Setup Frontend (Terminal 2)

```bash
cd client

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local

# Start the frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 4. Create Your First Experiment! 🎉

1. Open `http://localhost:3000` in your browser
2. Click **"Create New Experiment"**
3. Enter a prompt (e.g., "Explain quantum computing in simple terms")
4. Add temperature values (e.g., 0.5, 0.7, 1.0)
5. Add top-p values (e.g., 0.8, 0.9, 1.0)
6. Click **"Create Experiment"**
7. Watch as responses are generated and compared!

## 📚 Documentation

### Backend Documentation

| Document | Description |
|----------|-------------|
| [**Server README**](./server/README.md) | Complete backend documentation, API endpoints, and setup |
| [**Architecture Guide**](./server/ARCHITECTURE.md) | System design, decisions, and implementation details |
| [**API Examples**](./server/API_EXAMPLES.md) | curl commands and response examples for all endpoints |
| [**Environment Template**](./server/ENV_TEMPLATE.md) | All environment variables explained |

### Frontend Documentation

| Document | Description |
|----------|-------------|
| [**Frontend Guide**](./client/FRONTEND_README.md) | Complete frontend documentation, features, and components |
| [**Next.js README**](./client/README.md) | Next.js specific information and deployment |

## 🏗️ Tech Stack

### Backend
- **Framework**: NestJS + TypeScript
- **LLM Provider**: Groq (Mixtral, LLaMA models)
- **Database**: Firebase Firestore
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: Next.js 15 (App Router)
- **React**: React 19 with Server Components
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Language**: TypeScript

## ✨ Key Features

### Backend
- 🤖 **LLM Support** via Groq API
- 📊 **5 Quality Metrics**: Coherence, Relevancy, Completeness, Repetition, Length
- ⚡ **Async Processing** with concurrent LLM calls
- 💾 **Firestore Integration** for data persistence
- 📈 **Analytics & Correlations** between parameters and quality
- 📤 **Export to JSON/CSV** for external analysis

### Frontend
- 🎨 **Modern UI** with shadcn/ui components
- 📱 **Responsive Design** works on all devices
- 🔄 **Real-time Updates** during experiment execution
- 📊 **Comparison Tables** to analyze results
- 🏆 **Automatic Ranking** by overall score
- 🎯 **Visual Metrics** with color-coded scores

## 📊 Quality Metrics Explained

Each response is evaluated using **5 programmatic metrics**:

1. **Coherence Score** (25%) - Sentence quality, grammar, and structure
2. **Relevancy Score** (25%) - How well it addresses the prompt
3. **Completeness Score** (20%) - Response is not truncated
4. **Repetition Score** (20%) - Detects loops and stuck responses
5. **Length Score** (10%) - Appropriate response length

**Overall Score** = Weighted average of all 5 metrics (0-100)

## 📁 Project Structure

```
llm-lab/
├── server/              # Backend API (NestJS)
│   ├── src/
│   │   ├── experiments/ # Experiment logic & controllers
│   │   ├── llm/        # LLM provider integration
│   │   ├── metrics/    # Quality metrics calculation
│   │   └── database/   # Firestore service
│   ├── API_EXAMPLES.md
│   ├── ARCHITECTURE.md
│   └── README.md
│
├── client/             # Frontend (Next.js)
│   ├── src/
│   │   ├── app/       # Pages and routing
│   │   ├── components/ # React components
│   │   └── types/     # TypeScript types
│   ├── FRONTEND_README.md
│   └── README.md
│
└── README.md          # This file
```

## 🔧 Development

### Backend Development

```bash
cd server

# Development mode with hot reload
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Format code
npm run format

# Lint and fix
npm run lint
```

### Frontend Development

```bash
cd client

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

## 🧪 Example API Flow

1. **Create Experiment**:
   ```bash
   POST /api/experiments
   {
     "prompt": "Explain photosynthesis",
     "temperatures": [0.5, 0.7, 1.0],
     "topPs": [0.8, 0.9, 1.0]
   }
   ```

2. **Get Experiment Metrics**:
   ```bash
   GET /api/experiments/{id}/metrics
   ```

3. **Export Results**:
   ```bash
   GET /api/experiments/{id}/export?format=csv
   ```

See [API_EXAMPLES.md](./server/API_EXAMPLES.md) for detailed examples with responses.

## 🚀 Deployment

### Backend (Render)

Backend is configured for Render deployment.

Required environment variables:
- `GROQ_API_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `CORS_ORIGIN` (your frontend URL)

### Frontend (Vercel)

Frontend is optimized for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set `NEXT_PUBLIC_API_URL` environment variable
3. Deploy!

See [client/FRONTEND_README.md](./client/FRONTEND_README.md) for more details.

## 🐛 Troubleshooting

### Backend Issues

**Firebase Connection Error**
- Verify credentials in `.env`
- Check service account key
- Ensure Firestore is enabled

**Groq API Error**
- Verify API key is valid
- Check rate limits in Groq console
- Ensure model name is supported

**Port Already in Use**
```bash
lsof -ti:3001 | xargs kill -9
```

### Frontend Issues

**API Connection Failed**
- Ensure backend is running on `http://localhost:3001`
- Check CORS configuration in backend
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

**Build Errors**
```bash
rm -rf .next node_modules
npm install
npm run dev
```

## 📈 Performance

- **Concurrent LLM Calls**: 5 (configurable)
- **Max Parameter Combinations**: 20 per experiment
- **Average Response Time**: 2-3 seconds per LLM call
- **Async Processing**: Fully non-blocking

