# Environment Variables Template

Create a `.env` file in the server root directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Groq API Configuration
GROQ_API_KEY=gsk_your_groq_api_key_here
DEFAULT_MODEL=mixtral-8x7b-32768
MAX_CONCURRENT_LLM_CALLS=5
REQUEST_TIMEOUT_MS=30000

# Firebase/Firestore Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"

# Or alternatively use service account file path:
# GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

# Experiment Limits
MAX_PARAMETER_COMBINATIONS=20
```

## Setup Instructions

1. Get your Groq API key from https://console.groq.com/
2. Create a Firebase project at https://console.firebase.google.com/
3. Enable Firestore in your Firebase project
4. Generate a service account key from Project Settings > Service Accounts
5. Copy the credentials to your .env file


