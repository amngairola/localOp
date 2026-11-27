import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentService } from '../services/document.service';
import { DocumentRepository } from '../repositories/document.repository';
import { SupabaseStorageService } from '../storage/supabaseStorage';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../utils/errors';
import { Document, Folder } from '@prisma/client';

describe('DocumentService', () => {
  let mockRepo: DocumentRepository;
  let mockStorage: SupabaseStorageService;
  let service: DocumentService;

  const mockDoc: Document = {
    id: 'doc-001',
    userId: 'user-alpha',
    name: 'Passport Scan',
    originalName: 'passport.pdf',
    mimeType: 'application/pdf',
    size: 2048576,
    storagePath: 'documents/user-alpha/doc-001/passport.pdf',
    category: 'IDENTITY',
    type: 'PDF',
    description: 'Government issued passport',
    tags: ['passport', 'identity'],
    folderId: 'folder-001',
    billId: null,
    expenseId: null,
    subscriptionId: null,
    createdAt: new Date('2026-11-20T10:00:00Z'),
    updatedAt: new Date('2026-11-20T10:00:00Z'),
  };

  const mockFolder: Folder = {
    id: 'folder-001',
    userId: 'user-alpha',
    name: 'Personal IDs',
    color: '#3b82f6',
    createdAt: new Date('2026-11-01T00:00:00Z'),
    updatedAt: new Date('2026-11-01T00:00:00Z'),
  };

  beforeEach(() => {
    mockRepo = {
      findMany: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      moveToFolder: vi.fn(),
      delete: vi.fn(),
      getVaultStats: vi.fn(),
      findFolders: vi.fn(),
      findFolderById: vi.fn(),
      findFolderByName: vi.fn(),
      createFolder: vi.fn(),
      updateFolder: vi.fn(),
      deleteFolder: vi.fn(),
      verifyBillOwnership: vi.fn(),
      verifyExpenseOwnership: vi.fn(),
      verifySubscriptionOwnership: vi.fn(),
    } as unknown as DocumentRepository;

    mockStorage = {
      uploadDocument: vi.fn(),
      getSignedUrl: vi.fn(),
      deleteFile: vi.fn(),
    } as unknown as SupabaseStorageService;

    service = new DocumentService(mockRepo, mockStorage);
  });

  describe('detectDocumentType', () => {
    it('detects PDF from MIME type and filename', () => {
      expect(service.detectDocumentType('application/pdf', 'file.pdf')).toBe('PDF');
      expect(service.detectDocumentType('application/octet-stream', 'document.pdf')).toBe('PDF');
    });

    it('detects IMAGE from MIME type', () => {
      expect(service.detectDocumentType('image/png', 'photo.png')).toBe('IMAGE');
      expect(service.detectDocumentType('image/jpeg', 'receipt.jpg')).toBe('IMAGE');
    });

    it('detects WORD from MIME and extensions', () => {
      expect(service.detectDocumentType('application/msword', 'contract.doc')).toBe('WORD');
      expect(service.detectDocumentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'resume.docx')).toBe('WORD');
    });

    it('detects SPREADSHEET from MIME and extensions', () => {
      expect(service.detectDocumentType('application/vnd.ms-excel', 'data.xls')).toBe('SPREADSHEET');
      expect(service.detectDocumentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'budget.xlsx')).toBe('SPREADSHEET');
    });

    it('detects TEXT from text/plain', () => {
      expect(service.detectDocumentType('text/plain', 'notes.txt')).toBe('TEXT');
    });

    it('defaults to OTHER for unknown types', () => {
      expect(service.detectDocumentType('application/zip', 'archive.zip')).toBe('OTHER');
    });
  });

  describe('listDocuments', () => {
    it('returns documents with pagination metadata', async () => {
      vi.mocked(mockRepo.findMany).mockResolvedValue({
        documents: [mockDoc],
        total: 1,
      });

      const result = await service.listDocuments('user-alpha', {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(mockRepo.findMany).toHaveBeenCalledWith('user-alpha', expect.objectContaining({ page: 1, limit: 10 }));
      expect(result.documents).toHaveLength(1);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('getDocument', () => {
    it('returns document with signed URL', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockDoc);
      vi.mocked(mockStorage.getSignedUrl).mockResolvedValue('https://supabase.co/signed-url/passport.pdf');

      const result = await service.getDocument('user-alpha', 'doc-001');

      expect(result.id).toBe('doc-001');
      expect(result.signedUrl).toBe('https://supabase.co/signed-url/passport.pdf');
    });

    it('throws NotFoundError if document not found or belongs to another user', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.getDocument('user-alpha', 'doc-missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('uploadDocument', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'passport.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.from('dummy pdf binary data'),
      size: 2048576,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    it('uploads file to storage and saves document record in DB', async () => {
      vi.mocked(mockRepo.findFolderById).mockResolvedValue(mockFolder);
      vi.mocked(mockStorage.uploadDocument).mockResolvedValue({
        storagePath: 'documents/user-alpha/doc_123/passport.pdf',
        signedUrl: 'https://supabase.co/signed-url/passport.pdf',
      });
      vi.mocked(mockRepo.create).mockResolvedValue(mockDoc);
      vi.mocked(mockStorage.getSignedUrl).mockResolvedValue('https://supabase.co/signed-url/passport.pdf');

      const result = await service.uploadDocument(
        'user-alpha',
        {
          name: 'Passport Scan',
          category: 'IDENTITY',
          folderId: 'folder-001',
          tags: ['passport', 'identity'],
        },
        mockFile
      );

      expect(mockStorage.uploadDocument).toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalledWith(
        'user-alpha',
        expect.objectContaining({ name: 'Passport Scan' }),
        expect.objectContaining({
          originalName: 'passport.pdf',
          mimeType: 'application/pdf',
          size: 2048576,
          documentType: 'PDF',
        })
      );
      expect(result.signedUrl).toBe('https://supabase.co/signed-url/passport.pdf');
    });

    it('throws ValidationError if file is missing', async () => {
      await expect(
        service.uploadDocument(
          'user-alpha',
          { name: 'Doc without file', category: 'OTHER', tags: [] },
          undefined as any
        )
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError if specified folderId does not exist or user does not own it', async () => {
      vi.mocked(mockRepo.findFolderById).mockResolvedValue(null);

      await expect(
        service.uploadDocument(
          'user-alpha',
          { name: 'Doc in alien folder', category: 'OTHER', folderId: 'folder-alien', tags: [] },
          mockFile
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError if user attempts to link to a bill they do not own', async () => {
      vi.mocked(mockRepo.verifyBillOwnership).mockResolvedValue(false);

      await expect(
        service.uploadDocument(
          'user-alpha',
          { name: 'Bill attachment', category: 'FINANCIAL', billId: 'bill-other-user', tags: [] },
          mockFile
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('cleans up uploaded storage file if database creation fails', async () => {
      vi.mocked(mockStorage.uploadDocument).mockResolvedValue({
        storagePath: 'documents/user-alpha/doc_123/passport.pdf',
        signedUrl: null,
      });
      vi.mocked(mockRepo.create).mockRejectedValue(new Error('Database write failure'));

      await expect(
        service.uploadDocument(
          'user-alpha',
          { name: 'Passport Scan', category: 'IDENTITY', tags: [] },
          mockFile
        )
      ).rejects.toThrow('Database write failure');

      expect(mockStorage.deleteFile).toHaveBeenCalledWith('documents/user-alpha/doc_123/passport.pdf');
    });
  });

  describe('updateDocument', () => {
    it('updates document metadata when owned by user', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockDoc);
      vi.mocked(mockRepo.update).mockResolvedValue({
        ...mockDoc,
        name: 'Updated Passport Scan',
      });

      const result = await service.updateDocument('user-alpha', 'doc-001', {
        name: 'Updated Passport Scan',
      });

      expect(result.name).toBe('Updated Passport Scan');
      expect(mockRepo.update).toHaveBeenCalledWith('user-alpha', 'doc-001', {
        name: 'Updated Passport Scan',
      });
    });

    it('throws NotFoundError if document does not exist', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(
        service.updateDocument('user-alpha', 'doc-missing', { name: 'New Name' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('moveDocument', () => {
    it('moves document to target folder', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockDoc);
      vi.mocked(mockRepo.findFolderById).mockResolvedValue(mockFolder);
      vi.mocked(mockRepo.moveToFolder).mockResolvedValue({
        ...mockDoc,
        folderId: 'folder-001',
      });

      const result = await service.moveDocument('user-alpha', 'doc-001', 'folder-001');

      expect(result.folderId).toBe('folder-001');
      expect(mockRepo.moveToFolder).toHaveBeenCalledWith('user-alpha', 'doc-001', 'folder-001');
    });

    it('moves document to root when folderId is null', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockDoc);
      vi.mocked(mockRepo.moveToFolder).mockResolvedValue({
        ...mockDoc,
        folderId: null,
      });

      const result = await service.moveDocument('user-alpha', 'doc-001', null);

      expect(result.folderId).toBeNull();
      expect(mockRepo.moveToFolder).toHaveBeenCalledWith('user-alpha', 'doc-001', null);
    });
  });

  describe('deleteDocument', () => {
    it('deletes storage file and database record', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockDoc);
      vi.mocked(mockStorage.deleteFile).mockResolvedValue();
      vi.mocked(mockRepo.delete).mockResolvedValue(mockDoc);

      await service.deleteDocument('user-alpha', 'doc-001');

      expect(mockStorage.deleteFile).toHaveBeenCalledWith(mockDoc.storagePath);
      expect(mockRepo.delete).toHaveBeenCalledWith('user-alpha', 'doc-001');
    });

    it('throws NotFoundError if document not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.deleteDocument('user-alpha', 'doc-missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Folder Management', () => {
    it('lists all folders with document counts', async () => {
      const foldersWithCount = [{ ...mockFolder, documentCount: 5 }];
      vi.mocked(mockRepo.findFolders).mockResolvedValue(foldersWithCount);

      const result = await service.listFolders('user-alpha');
      expect(result).toHaveLength(1);
      expect(result[0].documentCount).toBe(5);
    });

    it('creates folder if name is unique', async () => {
      vi.mocked(mockRepo.findFolderByName).mockResolvedValue(null);
      vi.mocked(mockRepo.createFolder).mockResolvedValue(mockFolder);

      const result = await service.createFolder('user-alpha', {
        name: 'Personal IDs',
        color: '#3b82f6',
      });

      expect(result.name).toBe('Personal IDs');
    });

    it('throws ConflictError when creating folder with existing name', async () => {
      vi.mocked(mockRepo.findFolderByName).mockResolvedValue(mockFolder);

      await expect(
        service.createFolder('user-alpha', { name: 'Personal IDs' })
      ).rejects.toThrow(ConflictError);
    });

    it('safely deletes folder without deleting child documents', async () => {
      vi.mocked(mockRepo.findFolderById).mockResolvedValue(mockFolder);
      vi.mocked(mockRepo.deleteFolder).mockResolvedValue(mockFolder);

      await service.deleteFolder('user-alpha', 'folder-001');

      expect(mockRepo.deleteFolder).toHaveBeenCalledWith('user-alpha', 'folder-001');
    });

    it('throws NotFoundError when deleting non-existent folder', async () => {
      vi.mocked(mockRepo.findFolderById).mockResolvedValue(null);

      await expect(service.deleteFolder('user-alpha', 'folder-none')).rejects.toThrow(NotFoundError);
    });
  });
});
