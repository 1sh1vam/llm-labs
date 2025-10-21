# API Testing Examples

This file contains example requests for testing the LLM Lab API using curl, HTTPie, or any API client like Postman/Insomnia.

## Base URL
```
http://localhost:3001
```

## Example Requests

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

### 2. Create a Simple Experiment
```bash
curl -X POST http://localhost:3001/api/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "parameterRanges": {
      "temperatures": [0.3, 0.7, 1.0],
      "topP": [0.9, 1.0]
    }
  }'
```

**Response:**
```json
{
  "experimentId": "xyz789abc",
  "status": "processing",
  "message": "Experiment started. Check status using GET /api/experiments/:id"
}
```

### 3. Create a Complex Experiment (Max 20 Combinations)
```bash
curl -X POST http://localhost:3001/api/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a comprehensive guide about machine learning for beginners. Include key concepts, applications, and getting started tips.",
    "parameterRanges": {
      "temperatures": [0.2, 0.5, 0.8, 1.0],
      "topP": [0.8, 0.9, 1.0],
    }
  }'
```

### 4. Get Experiment Status and Results
```bash
# Replace {experimentId} with actual ID from create response
curl http://localhost:3001/api/experiments/{experimentId}
```

**Response (when completed):**
```json
{
  "experiment": {
    "id": "xyz789abc",
    "prompt": "Explain quantum computing...",
    "status": "completed",
    "parameterRanges": {...},
    "model": "mixtral-8x7b-32768",
    "totalResponses": 12,
    "completedResponses": 12,
    "failedResponses": 0,
    "bestResponseId": "response123",
    "bestScore": 0.876,
    "averageScore": 0.742,
    "scoreDistribution": {
      "min": 0.623,
      "max": 0.876,
      "mean": 0.742,
      "median": 0.755
    },
    "createdAt": "...",
    "updatedAt": "..."
  },
  "responses": [
    {
      "id": "response123",
      "experimentId": "xyz789abc",
      "parameters": {
        "temperature": 0.3,
        "topP": 0.9,
        "maxTokens": 500,
        "model": "mixtral-8x7b-32768"
      },
      "responseText": "Quantum computing is...",
      "tokensUsed": 487,
      "generatedAt": "...",
      "latencyMs": 2340,
      "metrics": {
        "lengthScore": 0.92,
        "coherenceScore": 0.88,
        "completenessScore": 0.95,
        "repetitionScore": 0.91,
        "relevancyScore": 0.87,
        "overallScore": 0.876,
        "details": {
          "wordCount": 456,
          "sentenceCount": 23,
          "avgSentenceLength": 19.8,
          "uniqueWordRatio": 0.67,
          "paragraphCount": 4,
          ...
        }
      },
      "status": "success"
    },
    ...more responses
  ],
  "bestResponse": {
    ...same as best response in responses array
  }
}
```

### 5. Get All Experiments (History)
```bash
# Get first 20 experiments
curl http://localhost:3001/api/experiments

# Get with pagination
curl "http://localhost:3001/api/experiments?limit=10&offset=0"
```

**Response:**
```json
{
  "experiments": [
    {
      "id": "xyz789abc",
      "prompt": "Explain quantum computing...",
      "createdAt": "2025-10-21T10:30:00Z",
      "status": "completed",
      "totalResponses": 12,
      "averageScore": 0.742,
      "bestResponse": {
        "responseText": "Quantum computing is a revolutionary...",
        "overallScore": 0.876,
        "parameters": {
          "temperature": 0.3,
          "topP": 0.9,
          "maxTokens": 500
        }
      }
    },
    ...more experiments
  ],
  "total": 15,
  "hasMore": false
}
```

### 6. Get Detailed Metrics for an Experiment
```bash
curl http://localhost:3001/api/experiments/{experimentId}/metrics
```

**Response:**
```json
{
  "experimentId": "xyz789abc",
  "prompt": "Explain quantum computing...",
  "summary": {
    "totalResponses": 12,
    "averageScore": 0.742,
    "bestScore": 0.876,
    "worstScore": 0.623,
    "scoreDistribution": [1, 0, 2, 3, 4, 2, 0, 0, 0, 0]
  },
  "metricBreakdown": {
    "byTemperature": {
      "0.3": 0.845,
      "0.7": 0.732,
      "1.0": 0.650
    },
    "byTopP": {
      "0.9": 0.768,
      "1.0": 0.716
    },
    "byMaxTokens": {
      "500": 0.755,
      "1000": 0.729
    }
  },
  "responses": [
    {
      "id": "response123",
      "parameters": {...},
      "metrics": {...},
      "responsePreview": "Quantum computing is a revolutionary approach..."
    },
    ...
  ]
}
```

**Insights from correlations:**
- `temperature_vs_score: -0.78` → Lower temperature produces better scores
- `temperature_vs_diversity: 0.85` → Higher temperature increases lexical diversity
- `topP_vs_score: -0.32` → Lower top_p slightly improves scores

### 7. Export Experiment (JSON)
```bash
curl http://localhost:3001/api/experiments/{experimentId}/export \
  -o experiment_results.json
```

### 8. Export Experiment (CSV)
```bash
curl "http://localhost:3001/api/experiments/{experimentId}/export?format=csv" \
  -o experiment_results.csv
```

**CSV Columns:**
```
Response ID, Temperature, Top-P, Max Tokens, Overall Score, Length Score, 
Coherence Score, Diversity Score, Structure Score, Completeness Score, 
Readability Score, Repetition Score, Relevancy Score, Word Count, Latency (ms)
```

### 9. Delete an Experiment
```bash
curl -X DELETE http://localhost:3001/api/experiments/{experimentId}
```

**Response:** `204 No Content`
```json
{
  message: "Experiment {experimentId} deleted successfully"
}
```

```bash
# 1. Check health
curl http://localhost:3001/api/health

# 2. Create experiment
RESPONSE=$(curl -s -X POST http://localhost:3001/api/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is machine learning?",
    "parameterRanges": {
      "temperatures": [0.5, 1.0],
      "topP": [0.9],
      "maxTokens": [300]
    }
  }')

# 3. Extract experiment ID
EXPERIMENT_ID=$(echo $RESPONSE | jq -r '.experimentId')
echo "Created experiment: $EXPERIMENT_ID"

# 4. Wait a bit for processing (2 responses × ~2-3 seconds each)
sleep 10

# 5. Check results
curl http://localhost:3001/api/experiments/$EXPERIMENT_ID | jq

# 6. Get metrics
curl http://localhost:3001/api/experiments/$EXPERIMENT_ID/metrics | jq

# 7. Export as CSV
curl "http://localhost:3001/api/experiments/$EXPERIMENT_ID/export?format=csv" \
  -o results.csv

# 8. View all experiments
curl http://localhost:3001/api/experiments | jq '.experiments[0]'
```