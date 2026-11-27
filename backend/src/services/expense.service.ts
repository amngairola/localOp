import {
  ExpenseRepository,
  expenseRepository,
  ExpenseAnalytics,
  BudgetStatus,
} from '../repositories/expense.repository';
import {
  SupabaseStorageService,
  supabaseStorageService,
} from '../storage/supabaseStorage';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  QueryExpenseDto,
  SetBudgetDto,
  QueryBudgetDto,
} from '../schemas/expense.schema';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { Expense, Budget } from '@prisma/client';

export interface EnhancedExpense extends Expense {
  signedReceiptUrl?: string | null;
}

export class ExpenseService {
  constructor(
    private repo: ExpenseRepository = expenseRepository,
    private storage: SupabaseStorageService = supabaseStorageService
  ) {}

  async listExpenses(
    userId: string,
    query: QueryExpenseDto
  ): Promise<{
    expenses: EnhancedExpense[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { expenses, total } = await this.repo.findMany(userId, query);

    return {
      expenses,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async getExpense(userId: string, id: string): Promise<EnhancedExpense> {
    const expense = await this.repo.findById(userId, id);
    if (!expense) {
      throw new NotFoundError('Expense');
    }

    let signedReceiptUrl: string | null = null;
    if (expense.receiptPath) {
      signedReceiptUrl = await this.storage.getSignedUrl(expense.receiptPath);
    }

    return {
      ...expense,
      signedReceiptUrl,
    };
  }

  async createExpense(
    userId: string,
    dto: CreateExpenseDto,
    file?: Express.Multer.File
  ): Promise<EnhancedExpense> {
    const expense = await this.repo.create(userId, dto);

    if (file) {
      const upload = await this.storage.uploadReceipt(
        userId,
        expense.id,
        file.buffer,
        file.originalname,
        file.mimetype
      );
      const updated = await this.repo.updateReceipt(userId, expense.id, upload.storagePath);
      const signedUrl = await this.storage.getSignedUrl(upload.storagePath);
      return {
        ...(updated || expense),
        signedReceiptUrl: signedUrl,
      };
    }

    return expense;
  }

  async updateExpense(
    userId: string,
    id: string,
    dto: UpdateExpenseDto
  ): Promise<EnhancedExpense> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Expense');
    }

    const updated = await this.repo.update(userId, id, dto);
    if (!updated) {
      throw new NotFoundError('Expense');
    }

    let signedReceiptUrl: string | null = null;
    if (updated.receiptPath) {
      signedReceiptUrl = await this.storage.getSignedUrl(updated.receiptPath);
    }

    return {
      ...updated,
      signedReceiptUrl,
    };
  }

  async uploadReceipt(
    userId: string,
    id: string,
    file: Express.Multer.File
  ): Promise<EnhancedExpense> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Expense');
    }

    // If an old receipt exists, delete it first
    if (existing.receiptPath) {
      await this.storage.deleteFile(existing.receiptPath);
    }

    const upload = await this.storage.uploadReceipt(
      userId,
      id,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const updated = await this.repo.updateReceipt(userId, id, upload.storagePath);
    const signedUrl = await this.storage.getSignedUrl(upload.storagePath);

    return {
      ...(updated || existing),
      signedReceiptUrl: signedUrl,
    };
  }

  async getReceiptSignedUrl(userId: string, id: string): Promise<string> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Expense');
    }

    if (!existing.receiptPath) {
      throw new NotFoundError('Receipt attachment');
    }

    const signedUrl = await this.storage.getSignedUrl(existing.receiptPath);
    if (!signedUrl) {
      throw new NotFoundError('Receipt URL could not be generated');
    }

    return signedUrl;
  }

  async deleteExpense(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError('Expense');
    }

    if (existing.receiptPath) {
      await this.storage.deleteFile(existing.receiptPath);
    }

    await this.repo.delete(userId, id);
  }

  async getAnalytics(
    userId: string,
    month?: number,
    year?: number,
    currency?: string
  ): Promise<ExpenseAnalytics> {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();
    const targetCurrency = currency ?? 'INR';

    return this.repo.getAnalytics(userId, targetMonth, targetYear, targetCurrency);
  }

  // --- Budget Operations ---

  async setBudget(userId: string, dto: SetBudgetDto): Promise<Budget> {
    return this.repo.upsertBudget(userId, dto);
  }

  async getBudgets(userId: string, query: QueryBudgetDto): Promise<BudgetStatus[]> {
    return this.repo.getBudgets(userId, query);
  }

  async deleteBudget(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.deleteBudget(userId, id);
    if (!deleted) {
      throw new NotFoundError('Budget');
    }
  }
}

export const expenseService = new ExpenseService();
