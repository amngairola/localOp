import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateQuery } from '../middleware/validate';
import { uploadDocumentMiddleware } from '../storage/supabaseStorage';
import { documentController } from '../controllers/document.controller';
import {
  uploadDocumentSchema,
  updateDocumentSchema,
  moveDocumentSchema,
  queryDocumentSchema,
  createFolderSchema,
  updateFolderSchema,
} from '../schemas/document.schema';

export const documentRouter = Router();

// Require authentication for all document routes
documentRouter.use(authenticate);

// --- Vault Statistics ---
documentRouter.get('/stats', documentController.stats);

// --- Folder Management ---
documentRouter.get('/folders', documentController.listFolders);
documentRouter.post('/folders', validateBody(createFolderSchema), documentController.createFolder);
documentRouter.patch('/folders/:id', validateBody(updateFolderSchema), documentController.updateFolder);
documentRouter.delete('/folders/:id', documentController.deleteFolder);

// --- Document Management ---
documentRouter.get('/', validateQuery(queryDocumentSchema), documentController.list);
documentRouter.post(
  '/upload',
  uploadDocumentMiddleware.single('file'),
  validateBody(uploadDocumentSchema),
  documentController.upload
);
documentRouter.get('/:id', documentController.getById);
documentRouter.get('/:id/signed-url', documentController.getSignedUrl);
documentRouter.get('/:id/download', documentController.getSignedUrl);
documentRouter.patch('/:id', validateBody(updateDocumentSchema), documentController.update);
documentRouter.patch('/:id/move', validateBody(moveDocumentSchema), documentController.move);
documentRouter.delete('/:id', documentController.delete);
