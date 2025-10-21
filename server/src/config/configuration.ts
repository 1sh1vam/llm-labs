export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  groq: {
    apiKey: process.env.GROQ_API_KEY,
    defaultModel: process.env.DEFAULT_MODEL || 'mixtral-8x7b-32768',
    maxConcurrentCalls: parseInt(
      process.env.MAX_CONCURRENT_LLM_CALLS || '5',
      10,
    ),
    requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },

  experiments: {
    maxCombinations: parseInt(
      process.env.MAX_PARAMETER_COMBINATIONS || '20',
      10,
    ),
  },
});
