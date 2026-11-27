import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateQuery } from '../middleware/validate';
import { uploadInvoiceMiddleware } from '../storage/supabaseStorage';
import { expenseController } from '../controllers/expense.controller';
import {
  createExpenseSchema,
  updateExpenseSchema,
  queryExpenseSchema,
  setBudgetSchema,
  queryBudgetSchema,
} from '../schemas/expense.schema';

export const expenseRouter = Router();

// Enforce authentication on all expense routes
expenseRouter.use(authenticate);

// Analytics & Budgets routes (before /:id)
expenseRouter.get('/analytics', expenseController.analytics);
expenseRouter.get(
  '/budgets',
  validateQuery(queryBudgetSchema),
  expenseController.getBudgets
);
expenseRouter.post(
  '/budgets',
  validateBody(setBudgetSchema),
  expenseController.setBudget
);
expenseRouter.delete('/budgets/:id', expenseController.deleteBudget);

// Expenses CRUD
expenseRouter.get(
  '/',
  validateQuery(queryExpenseSchema),
  expenseController.list
);
expenseRouter.post(
  '/',
  uploadInvoiceMiddleware.single('file'),
  validateBody(createExpenseSchema),
  expenseController.create
);
expenseRouter.get('/:id', expenseController.getById);
expenseRouter.patch(
  '/:id',
  validateBody(updateExpenseSchema),
  expenseController.update
);
expenseRouter.delete('/:id', expenseController.delete);
expenseRouter.post(
  '/:id/receipt',
  uploadInvoiceMiddleware.single('file'),
  expenseController.uploadReceipt
);
expenseRouter.get('/:id/receipt-url', expenseController.getReceiptUrl);
