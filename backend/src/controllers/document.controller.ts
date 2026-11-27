import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { documentService, DocumentService } from '../services/document.service';
import {
  successResponse,
  createdResponse,
  noContentResponse,
} from '../utils/response';
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  MoveDocumentDto,
  QueryDocumentDto,
  CreateFolderDto,
  UpdateFolderDto,
} from '../schemas/document.schema';

export class DocumentController {
  constructor(private service: DocumentService = documentService) {}

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const query = req.query as unknown as QueryDocumentDto;
    const result = await this.service.listDocuments(userId, query);
    successResponse(
      res,
      result.documents,
      'Documents retrieved successfully',
      result.pagination
    );
  };

  stats = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const data = await this.service.getVaultStats(userId);
    successResponse(res, data, 'Vault statistics retrieved successfully');
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const doc = await this.service.getDocument(userId, id);
    successResponse(res, doc, 'Document retrieved successfully');
  };

  upload = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const dto = req.body as UploadDocumentDto;
    const file = req.file;
    const doc = await this.service.uploadDocument(userId, dto, file!);
    createdResponse(res, doc, 'Document uploaded successfully');
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dto = req.body as UpdateDocumentDto;
    const doc = await this.service.updateDocument(userId, id, dto);
    successResponse(res, doc, 'Document updated successfully');
  };

  move = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { folderId } = req.body as MoveDocumentDto;
    const doc = await this.service.moveDocument(userId, id, folderId ?? null);
    successResponse(res, doc, 'Document moved successfully');
  };

  getSignedUrl = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const url = await this.service.getSignedUrl(userId, id);
    successResponse(res, { url }, 'Signed URL generated successfully');
  };

  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await this.service.deleteDocument(userId, id);
    noContentResponse(res);
  };

  // --- Folder Endpoints ---

  listFolders = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const folders = await this.service.listFolders(userId);
    successResponse(res, folders, 'Folders retrieved successfully');
  };

  createFolder = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const dto = req.body as CreateFolderDto;
    const folder = await this.service.createFolder(userId, dto);
    createdResponse(res, folder, 'Folder created successfully');
  };

  updateFolder = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dto = req.body as UpdateFolderDto;
    const folder = await this.service.updateFolder(userId, id, dto);
    successResponse(res, folder, 'Folder updated successfully');
  };

  deleteFolder = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await this.service.deleteFolder(userId, id);
    noContentResponse(res);
  };
}

export const documentController = new DocumentController();
