import {
  DocumentRepository,
  documentRepository,
  VaultStats,
  FolderWithCount,
} from '../repositories/document.repository';
import {
  SupabaseStorageService,
  supabaseStorageService,
} from '../storage/supabaseStorage';
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  QueryDocumentDto,
  CreateFolderDto,
  UpdateFolderDto,
} from '../schemas/document.schema';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../utils/errors';
import { Document, Folder, DocumentType } from '@prisma/client';

export interface EnhancedDocument extends Document {
  signedUrl?: string | null;
}

export class DocumentService {
  constructor(
    private repo: DocumentRepository = documentRepository,
    private storage: SupabaseStorageService = supabaseStorageService
  ) {}

  /**
   * Helper to determine document type from MIME type
   */
  detectDocumentType(mimeType: string, filename: string): DocumentType {
    const lowerMime = mimeType.toLowerCase();
    const lowerName = filename.toLowerCase();

    if (lowerMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
      return 'PDF';
    }
    if (lowerMime.startsWith('image/')) {
      return 'IMAGE';
    }
    if (
      lowerMime.includes('word') ||
      lowerName.endsWith('.doc') ||
      lowerName.endsWith('.docx')
    ) {
      return 'WORD';
    }
    if (
      lowerMime.includes('excel') ||
      lowerMime.includes('spreadsheet') ||
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.xlsx')
    ) {
      return 'SPREADSHEET';
    }
    if (lowerMime === 'text/plain' || lowerName.endsWith('.txt')) {
      return 'TEXT';
    }
    return 'OTHER';
  }

  async listDocuments(
    userId: string,
    query: QueryDocumentDto
  ): Promise<{
    documents: Document[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { documents, total } = await this.repo.findMany(userId, query);

    return {
      documents,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async getDocument(userId: string, id: string): Promise<EnhancedDocument> {
    const doc = await this.repo.findById(userId, id);
    if (!doc) {
      throw new NotFoundError('Document');
    }

    const signedUrl = await this.storage.getSignedUrl(doc.storagePath);

    return {
      ...doc,
      signedUrl,
    };
  }

  async uploadDocument(
    userId: string,
    dto: UploadDocumentDto,
    file: Express.Multer.File
  ): Promise<EnhancedDocument> {
    if (!file) {
      throw new ValidationError('A file must be provided for upload');
    }

    // Ownership validation for folder if provided
    if (dto.folderId) {
      const folder = await this.repo.findFolderById(userId, dto.folderId);
      if (!folder) {
        throw new NotFoundError('Target folder');
      }
    }

    // Ownership validation for linked financial records
    if (dto.billId) {
      const isOwner = await this.repo.verifyBillOwnership(userId, dto.billId);
      if (!isOwner) throw new ForbiddenError('You do not own the specified bill');
    }
    if (dto.expenseId) {
      const isOwner = await this.repo.verifyExpenseOwnership(userId, dto.expenseId);
      if (!isOwner) throw new ForbiddenError('You do not own the specified expense');
    }
    if (dto.subscriptionId) {
      const isOwner = await this.repo.verifySubscriptionOwnership(userId, dto.subscriptionId);
      if (!isOwner) throw new ForbiddenError('You do not own the specified subscription');
    }

    const docType = this.detectDocumentType(file.mimetype, file.originalname);
    const tempId = `doc_${Date.now()}`;

    // Upload to user-scoped path in Supabase Storage
    const uploadResult = await this.storage.uploadDocument(
      userId,
      tempId,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    try {
      const created = await this.repo.create(userId, dto, {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: uploadResult.storagePath,
        documentType: docType,
      });

      const signedUrl = await this.storage.getSignedUrl(created.storagePath);

      return {
        ...created,
        signedUrl,
      };
    } catch (error) {
      // Cleanup uploaded storage file if database creation fails
      await this.storage.deleteFile(uploadResult.storagePath);
      throw error;
    }
  }

  async updateDocument(
    userId: string,
    id: string,
    dto: UpdateDocumentDto
  ): Promise<Document> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Document');
    }

    if (dto.folderId) {
      const folder = await this.repo.findFolderById(userId, dto.folderId);
      if (!folder) throw new NotFoundError('Target folder');
    }
    if (dto.billId) {
      const isOwner = await this.repo.verifyBillOwnership(userId, dto.billId);
      if (!isOwner) throw new ForbiddenError('You do not own the specified bill');
    }
    if (dto.expenseId) {
      const isOwner = await this.repo.verifyExpenseOwnership(userId, dto.expenseId);
      if (!isOwner) throw new ForbiddenError('You do not own the specified expense');
    }
    if (dto.subscriptionId) {
      const isOwner = await this.repo.verifySubscriptionOwnership(userId, dto.subscriptionId);
      if (!isOwner) throw new ForbiddenError('You do not own the specified subscription');
    }

    const updated = await this.repo.update(userId, id, dto);
    if (!updated) {
      throw new NotFoundError('Document');
    }
    return updated;
  }

  async moveDocument(
    userId: string,
    id: string,
    folderId: string | null
  ): Promise<Document> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Document');
    }

    if (folderId) {
      const folder = await this.repo.findFolderById(userId, folderId);
      if (!folder) throw new NotFoundError('Target folder');
    }

    const moved = await this.repo.moveToFolder(userId, id, folderId);
    if (!moved) {
      throw new NotFoundError('Document');
    }
    return moved;
  }

  async getSignedUrl(userId: string, id: string): Promise<string> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Document');
    }

    const signedUrl = await this.storage.getSignedUrl(existing.storagePath);
    if (!signedUrl) {
      throw new NotFoundError('Signed URL could not be generated');
    }
    return signedUrl;
  }

  async deleteDocument(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Document');
    }

    // Delete file from Supabase storage first
    if (existing.storagePath) {
      await this.storage.deleteFile(existing.storagePath);
    }

    await this.repo.delete(userId, id);
  }

  async getVaultStats(userId: string): Promise<VaultStats> {
    return this.repo.getVaultStats(userId);
  }

  // --- Folder Management ---

  async listFolders(userId: string): Promise<FolderWithCount[]> {
    return this.repo.findFolders(userId);
  }

  async createFolder(userId: string, dto: CreateFolderDto): Promise<Folder> {
    const existing = await this.repo.findFolderByName(userId, dto.name);
    if (existing) {
      throw new ConflictError(`Folder "${dto.name}" already exists`);
    }

    return this.repo.createFolder(userId, dto);
  }

  async updateFolder(
    userId: string,
    id: string,
    dto: UpdateFolderDto
  ): Promise<Folder> {
    const folder = await this.repo.findFolderById(userId, id);
    if (!folder) {
      throw new NotFoundError('Folder');
    }

    if (dto.name && dto.name.toLowerCase() !== folder.name.toLowerCase()) {
      const duplicate = await this.repo.findFolderByName(userId, dto.name);
      if (duplicate) {
        throw new ConflictError(`Folder "${dto.name}" already exists`);
      }
    }

    const updated = await this.repo.updateFolder(userId, id, dto);
    if (!updated) {
      throw new NotFoundError('Folder');
    }
    return updated;
  }

  async deleteFolder(userId: string, id: string): Promise<void> {
    const folder = await this.repo.findFolderById(userId, id);
    if (!folder) {
      throw new NotFoundError('Folder');
    }

    // Safely unlinks documents to root before deleting folder
    await this.repo.deleteFolder(userId, id);
  }
}

export const documentService = new DocumentService();
