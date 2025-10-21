import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../../database/firestore.service';
import { Response } from '../../common/entities/response.entity';

/**
 * Repository Pattern for Responses
 * Handles responses as a subcollection of experiments
 */
@Injectable()
export class ResponsesRepository {
  private readonly logger = new Logger(ResponsesRepository.name);
  private readonly PARENT_COLLECTION = 'experiments';
  private readonly SUBCOLLECTION = 'responses';

  constructor(private readonly firestoreService: FirestoreService) {}

  async create(
    experimentId: string,
    response: Omit<Response, 'id'>,
  ): Promise<string> {
    const id = await this.firestoreService.createSubdocument(
      this.PARENT_COLLECTION,
      experimentId,
      this.SUBCOLLECTION,
      response,
    );
    this.logger.debug(`Created response ${id} for experiment ${experimentId}`);
    return id;
  }

  async findByExperimentId(experimentId: string): Promise<Response[]> {
    return this.firestoreService.getSubdocuments(
      this.PARENT_COLLECTION,
      experimentId,
      this.SUBCOLLECTION,
    );
  }

  async findById(
    experimentId: string,
    responseId: string,
  ): Promise<Response | null> {
    const responses = await this.findByExperimentId(experimentId);
    return responses.find((r) => r.id === responseId) || null;
  }

  async deleteByExperimentId(experimentId: string): Promise<void> {
    const responses = await this.findByExperimentId(experimentId);
    const batch = this.firestoreService.batch();

    responses.forEach((response) => {
      const docRef = this.firestoreService
        .subcollection(this.PARENT_COLLECTION, experimentId, this.SUBCOLLECTION)
        .doc(response.id!);
      batch.delete(docRef);
    });

    await batch.commit();
    this.logger.debug(`Deleted all responses for experiment ${experimentId}`);
  }

  async findSuccessfulByExperimentId(
    experimentId: string,
  ): Promise<Response[]> {
    const responses = await this.findByExperimentId(experimentId);
    return responses.filter((r) => r.status === 'success');
  }
}
