import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { expenseService, ExpenseService } from '../services/expense.service';
import {
  successResponse,
  createdResponse,
  noContentResponse,
} from '../utils/response';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  QueryExpenseDto,
  SetBudgetDto,
  QueryBudgetDto,
} from '../schemas/expense.schema';

export class ExpenseController {
  constructor(private service: ExpenseService = expenseService) {}

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const query = req.query as unknown as QueryExpenseDto;
    const result = await this.service.listExpenses(userId, query);
    successResponse(
      res,
      result.expenses,
      'Expenses retrieved successfully',
      result.pagination
    );
  };

  analytics = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const currency = req.query.currency as string | undefined;

    const data = await this.service.getAnalytics(userId, month, year, currency);
    successResponse(res, data, 'Expense analytics retrieved successfully');
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const expense = await this.service.getExpense(userId, id);
    successResponse(res, expense, 'Expense retrieved successfully');
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const dto = req.body as CreateExpenseDto;
    const file = req.file;
    const expense = await this.service.createExpense(userId, dto, file);
    createdResponse(res, expense, 'Expense recorded successfully');
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dto = req.body as UpdateExpenseDto;
    const expense = await this.service.updateExpense(userId, id, dto);
    successResponse(res, expense, 'Expense updated successfully');
  };

  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await this.service.deleteExpense(userId, id);
    noContentResponse(res);
  };

  uploadReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No receipt file provided', code: 'FILE_REQUIRED' });
      return;
    }
    const expense = await this.service.uploadReceipt(userId, id, file);
    successResponse(res, expense, 'Receipt uploaded successfully');
  };

  getReceiptUrl = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const signedUrl = await this.service.getReceiptSignedUrl(userId, id);
    successResponse(res, { signedUrl }, 'Receipt download URL generated successfully');
  };

  // --- Budgets ---

  getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const query = req.query as unknown as QueryBudgetDto;
    const budgets = await this.service.getBudgets(userId, query);
    successResponse(res, budgets, 'Budgets retrieved successfully');
  };

  setBudget = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const dto = req.body as SetBudgetDto;
    const budget = await this.service.setBudget(userId, dto);
    createdResponse(res, budget, 'Budget configured successfully');
  };

  deleteBudget = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await this.service.deleteBudget(userId, id);
    noContentResponse(res);
  };
}

export const expenseController = new ExpenseController();
