import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../../database/firestore.service';
import { Experiment } from '../../common/entities/experiment.entity';

/**
 * Repository Pattern for Experiments
 * Abstracts data access logic from business logic
 */
@Injectable()
export class ExperimentsRepository {
  private readonly logger = new Logger(ExperimentsRepository.name);
  private readonly COLLECTION = 'experiments';

  constructor(private readonly firestoreService: FirestoreService) {}

  async create(experiment: Omit<Experiment, 'id'>): Promise<string> {
    const id = await this.firestoreService.createDocument(
      this.COLLECTION,
      experiment,
    );
    this.logger.debug(`Created experiment: ${id}`);
    return id;
  }

  async findById(id: string): Promise<Experiment | null> {
    return this.firestoreService.getDocument(this.COLLECTION, id);
  }

  async findAll(
    limit: number = 20,
    startAfter?: string,
  ): Promise<Experiment[]> {
    if (startAfter) {
      // Cursor-based pagination - efficient!
      const startDoc = await this.firestoreService
        .collection(this.COLLECTION)
        .doc(startAfter)
        .get();

      return this.firestoreService.queryDocuments(this.COLLECTION, (ref) =>
        ref.orderBy('createdAt', 'desc').startAfter(startDoc).limit(limit),
      );
    } else {
      // First page
      return this.firestoreService.queryDocuments(this.COLLECTION, (ref) =>
        ref.orderBy('createdAt', 'desc').limit(limit),
      );
    }
  }

  async update(id: string, updates: Partial<Experiment>): Promise<void> {
    await this.firestoreService.updateDocument(this.COLLECTION, id, updates);
    this.logger.debug(`Updated experiment: ${id}`);
  }

  async delete(id: string): Promise<void> {
    await this.firestoreService.deleteDocument(this.COLLECTION, id);
    this.logger.debug(`Deleted experiment: ${id}`);
  }

  async updateStatus(
    id: string,
    status: Experiment['status'],
    error?: string,
  ): Promise<void> {
    const updates: Partial<Experiment> = {
      status,
      updatedAt: this.firestoreService.timestamp() as any,
    };
    if (error) {
      updates.error = error;
    }
    await this.update(id, updates);
  }

  async updateWithResults(
    id: string,
    results: {
      completedResponses: number;
      failedResponses: number;
      bestResponseId?: string;
      bestScore?: number;
      averageScore: number;
      scoreDistribution: Experiment['scoreDistribution'];
    },
  ): Promise<void> {
    await this.update(id, {
      ...results,
      status: 'completed' as any,
      updatedAt: this.firestoreService.timestamp() as any,
    });
  }
}
