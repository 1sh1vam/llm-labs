import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class FirestoreService implements OnModuleInit {
  private readonly logger = new Logger(FirestoreService.name);
  private firestore: Firestore;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    try {
      const projectId = this.configService.get<string>('firebase.projectId');
      const clientEmail = this.configService.get<string>(
        'firebase.clientEmail',
      );
      const privateKey = this.configService.get<string>('firebase.privateKey');
      const credentialsPath = this.configService.get<string>(
        'firebase.credentialsPath',
      );

      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        if (credentialsPath) {
          // Use service account file
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
        } else if (projectId && clientEmail && privateKey) {
          // Use environment variables
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        } else {
          throw new Error(
            'Firebase credentials not configured. Please set FIREBASE_* environment variables or GOOGLE_APPLICATION_CREDENTIALS',
          );
        }
      }

      this.firestore = admin.firestore();
      this.logger.log('Firestore initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firestore', error);
      throw error;
    }
  }

  getFirestore(): Firestore {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }
    return this.firestore;
  }

  // Helper methods for common operations
  collection(collectionName: string) {
    return this.getFirestore().collection(collectionName);
  }

  async createDocument(collectionName: string, data: any): Promise<string> {
    const docRef = await this.collection(collectionName).add(data);
    return docRef.id;
  }

  async getDocument(collectionName: string, documentId: string): Promise<any> {
    const doc = await this.collection(collectionName).doc(documentId).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  async updateDocument(
    collectionName: string,
    documentId: string,
    data: any,
  ): Promise<void> {
    await this.collection(collectionName).doc(documentId).update(data);
  }

  async deleteDocument(
    collectionName: string,
    documentId: string,
  ): Promise<void> {
    await this.collection(collectionName).doc(documentId).delete();
  }

  async queryDocuments(
    collectionName: string,
    queryFn?: (
      ref: FirebaseFirestore.CollectionReference,
    ) => FirebaseFirestore.Query,
  ): Promise<any[]> {
    let query: FirebaseFirestore.Query = this.collection(collectionName);

    if (queryFn) {
      query = queryFn(this.collection(collectionName));
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // Subcollection helpers
  subcollection(
    parentCollection: string,
    parentId: string,
    subcollectionName: string,
  ) {
    return this.collection(parentCollection)
      .doc(parentId)
      .collection(subcollectionName);
  }

  async createSubdocument(
    parentCollection: string,
    parentId: string,
    subcollectionName: string,
    data: any,
  ): Promise<string> {
    const docRef = await this.subcollection(
      parentCollection,
      parentId,
      subcollectionName,
    ).add(data);
    return docRef.id;
  }

  async getSubdocuments(
    parentCollection: string,
    parentId: string,
    subcollectionName: string,
  ): Promise<any[]> {
    const snapshot = await this.subcollection(
      parentCollection,
      parentId,
      subcollectionName,
    ).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // Batch operations
  batch() {
    return this.getFirestore().batch();
  }

  // Timestamp helper
  timestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
  }
}
