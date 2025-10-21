# Architecture Guide

```
┌──────────────────────────────────────────┐
│  Presentation Layer                      │
│  • ExperimentsController                 │
└──────────────┬───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│  Application Layer (Services)            │
│  • ExperimentsService (orchestration)    │
│  • MetricsService (domain logic)         │
└────┬──────────────────────┬──────────────┘
     │                      │
┌────▼──────────────┐  ┌────▼────────────────┐
│  Repository Layer │  │  Infrastructure     │
│  • ExperimentsRepo│  │  • LLMFacade       │
│  • ResponsesRepo  │  │  • GroqProvider    │
└────┬──────────────┘  └────┬────────────────┘
     │                      │
┌────▼──────────────────────▼────────────────┐
│  Infrastructure                             │
│  • FirestoreService                        │
│  • Groq API                                │
└────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Easy to swap implementations
- ✅ Testable (mock repositories)
- ✅ Follows SOLID principles

## 🏗️ Structure

### 1. Repository Layer (Data Access)

**Purpose:** Abstract database operations from business logic

```typescript
// experiments/repositories/experiments.repository.ts
@Injectable()
export class ExperimentsRepository {
  constructor(private firestoreService: FirestoreService) {}
  
  async create(experiment: Experiment): Promise<string>
  async findById(id: string): Promise<Experiment | null>
  async findAll(limit, offset): Promise<Experiment[]>
  async update(id: string, updates: Partial<Experiment>): Promise<void>
  async delete(id: string): Promise<void>
}
```

**Benefits:**
- Domain-specific methods (create, findById, etc.)
- Hides Firestore implementation details
- Easy to swap database (MongoDB, PostgreSQL, etc.)
- Mockable for testing

### 2. Infrastructure Layer (External Services)

**Purpose:** Abstract external service providers

```typescript
// llm/interfaces/llm.interface.ts
export interface ILLMProvider {
  generate(options): Promise<LLMGenerateResult>
  generateBatch(options[]): Promise<LLMGenerateResult[]>
  testConnection(): Promise<boolean>
}

// llm/providers/groq.provider.ts
@Injectable()
export class GroqProvider implements ILLMProvider {
  // Groq-specific implementation
}

// llm/llm.facade.ts (Facade Pattern)
@Injectable()
export class LLMFacade {
  constructor(private groqProvider: GroqProvider) {}
  
  async generate(options): Promise<LLMGenerateResult> {
    // Can switch providers here
    return this.groqProvider.generate(options);
  }
}
```

**Benefits:**
- Easy to add new LLM providers (OpenAI, Anthropic)
- Unified interface via Facade pattern
- Provider-specific logic isolated
- Can implement fallback strategies

### 3. Service Layer (Business Logic)

**Purpose:** Orchestrate workflows, implement use cases

```typescript
// experiments/experiments.service.ts
@Injectable()
export class ExperimentsService {
  constructor(
    private experimentsRepo: ExperimentsRepository,
    private responsesRepo: ResponsesRepository,
    private llmFacade: LLMFacade,
    private metricsService: MetricsService,
  ) {}
  
  async createExperiment(dto): Promise<string> {
    // 1. Validate business rules
    // 2. Use repository to persist
    // 3. Orchestrate async processing
  }
}
```

**Benefits:**
- Focuses on business logic
- No database or API implementation details
- Easy to understand and maintain
- Testable with mocked dependencies


## 📁 File Structure

```
src/
├── experiments/
│   ├── experiments.controller.ts     # HTTP layer
│   ├── experiments.service.ts        # Business logic
│   ├── repositories/                 # Repositories
│   │   ├── experiments.repository.ts
│   │   └── responses.repository.ts
│   └── dto/
│   └── interfaces/
│   └── types/
│
├── llm/
│   ├── llm.facade.ts                # ✨ Unified llm interface
│   ├── interfaces/                  
│   │   └── llm.interface.ts
│   └── providers/                   
│       └── groq.provider.ts       
│
├── metrics/
│   ├── metrics.module.ts   
│   └── metrics.service.ts           # Domain logic
│
└── database/
    └── firestore.service.ts         # Infrastructure
```

## 🎨 Design Patterns Used

### 1. Repository Pattern
```typescript
// Abstracts data access
interface Repository<T> {
  create(entity: T): Promise<string>;
  findById(id: string): Promise<T | null>;
  update(id: string, updates: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 2. Facade Pattern
```typescript
// Provides simplified interface to complex subsystems
class LLMFacade {
  constructor(
    private groqProvider: GroqProvider,
    private openaiProvider: OpenAIProvider,
  ) {}
  
  generate(options) {
    // Choose provider based on config/options
    return this.groqProvider.generate(options);
  }
}
```

### 3. Strategy Pattern (Future)
```typescript
// Different LLM providers as strategies
interface LLMStrategy {
  generate(options): Promise<Result>;
}

class GroqStrategy implements LLMStrategy { ... }
class OpenAIStrategy implements LLMStrategy { ... }
```

## ✅ Benefits of This Architecture

### 1. Separation of Concerns
- **Controllers** handle HTTP
- **Services** handle business logic
- **Repositories** handle data access
- **Providers** handle external APIs

### 2. Testability
```typescript
// Easy to mock repositories
const mockRepo = {
  create: jest.fn().mockResolvedValue('test-id'),
  findById: jest.fn().mockResolvedValue({ id: 'test', ... }),
};

const service = new ExperimentsService(mockRepo, ...);
```

### 3. Flexibility
- Swap Groq → OpenAI without changing service layer
- Swap Firestore → PostgreSQL without changing service layer
- Add caching layer in repository without changing service

### 4. Maintainability
- Clear responsibility for each layer
- Easy to find where to make changes
- Self-documenting code

### 5. Scalability
- Can split different services into separate microservices in future
- Can implement CQRS (Command Query Responsibility Segregation)
- Can add event sourcing

## 🚀 Future Enhancements

### 1. Add CQRS
```typescript
// Separate read and write models
class CreateExperimentCommand { ... }
class GetExperimentQuery { ... }

// Command handlers
class CreateExperimentHandler {
  handle(command: CreateExperimentCommand) { ... }
}
```

### 2. Add Caching Layer
```typescript
// Decorator pattern for caching
class CachedExperimentsRepository implements ExperimentsRepository {
  constructor(
    private inner: ExperimentsRepository,
    private cache: CacheService,
  ) {}
  
  async findById(id: string) {
    const cached = await this.cache.get(`exp:${id}`);
    if (cached) return cached;
    
    const result = await this.inner.findById(id);
    await this.cache.set(`exp:${id}`, result);
    return result;
  }
}
```


