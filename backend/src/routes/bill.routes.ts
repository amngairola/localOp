import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateQuery } from '../middleware/validate';
import { uploadInvoiceMiddleware } from '../storage/supabaseStorage';
import { billController } from '../controllers/bill.controller';
import {
  createBillSchema,
  updateBillSchema,
  queryBillSchema,
  markBillPaidSchema,
} from '../schemas/bill.schema';

export const billRouter = Router();

// Enforce authentication on all bill routes
billRouter.use(authenticate);

billRouter.get('/', validateQuery(queryBillSchema), billController.list);
billRouter.get('/summary', billController.summary);
billRouter.post(
  '/',
  uploadInvoiceMiddleware.single('file'),
  validateBody(createBillSchema),
  billController.create
);
billRouter.get('/:id', billController.getById);
billRouter.patch('/:id', validateBody(updateBillSchema), billController.update);
billRouter.delete('/:id', billController.delete);
billRouter.post('/:id/mark-paid', validateBody(markBillPaidSchema), billController.markPaid);
billRouter.post(
  '/:id/attachment',
  uploadInvoiceMiddleware.single('file'),
  billController.uploadAttachment
);
billRouter.get('/:id/attachment-url', billController.getAttachmentUrl);
