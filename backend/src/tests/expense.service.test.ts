import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseService } from '../services/expense.service';
import { ExpenseRepository } from '../repositories/expense.repository';
import { SupabaseStorageService } from '../storage/supabaseStorage';
import { NotFoundError, ValidationError } from '../utils/errors';
import { Expense, Prisma, Budget } from '@prisma/client';

describe('ExpenseService', () => {
  let mockRepo: ExpenseRepository;
  let mockStorage: SupabaseStorageService;
  let service: ExpenseService;

  const mockExpense: Expense = {
    id: 'exp-001',
    userId: 'user-alpha',
    title: 'Whole Foods Market',
    description: 'Weekly organic groceries',
    amount: new Prisma.Decimal(2450.5),
    currency: 'INR',
    category: 'GROCERIES',
    date: new Date('2026-11-20T10:30:00Z'),
    paymentMethod: 'UPI',
    merchant: 'Whole Foods',
    notes: 'Bought fresh produce',
    receiptUrl: null,
    receiptPath: 'receipts/user-alpha/exp-001/receipt.jpg',
    tags: ['groceries', 'organic'],
    createdAt: new Date('2026-11-20T10:30:00Z'),
    updatedAt: new Date('2026-11-20T10:30:00Z'),
  };

  const mockBudget: Budget = {
    id: 'bgt-001',
    userId: 'user-alpha',
    month: 11,
    year: 2026,
    amount: new Prisma.Decimal(15000),
    currency: 'INR',
    category: 'GROCERIES',
    createdAt: new Date('2026-11-01T00:00:00Z'),
    updatedAt: new Date('2026-11-01T00:00:00Z'),
  };

  beforeEach(() => {
    mockRepo = {
      findMany: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateReceipt: vi.fn(),
      delete: vi.fn(),
      getAnalytics: vi.fn(),
      upsertBudget: vi.fn(),
      getBudgets: vi.fn(),
      deleteBudget: vi.fn(),
    } as unknown as ExpenseRepository;

    mockStorage = {
      uploadReceipt: vi.fn(),
      getSignedUrl: vi.fn(),
      deleteFile: vi.fn(),
    } as unknown as SupabaseStorageService;

    service = new ExpenseService(mockRepo, mockStorage);
  });

  describe('createExpense', () => {
    it('creates an expense without file attachment', async () => {
      vi.mocked(mockRepo.create).mockResolvedValue(mockExpense);

      const result = await service.createExpense('user-alpha', {
        title: 'Whole Foods Market',
        amount: 2450.5,
        currency: 'INR',
        category: 'GROCERIES',
        date: '2026-11-20T10:30:00Z',
        merchant: 'Whole Foods',
        tags: ['groceries'],
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        'user-alpha',
        expect.objectContaining({ title: 'Whole Foods Market', amount: 2450.5 })
      );
      expect(result.id).toBe('exp-001');
    });

    it('uploads receipt file to Supabase storage and attaches signed URL', async () => {
      vi.mocked(mockRepo.create).mockResolvedValue(mockExpense);
      vi.mocked(mockStorage.uploadReceipt).mockResolvedValue({
        storagePath: 'receipts/user-alpha/exp-001/receipt.jpg',
      });
      vi.mocked(mockRepo.updateReceipt).mockResolvedValue(mockExpense);
      vi.mocked(mockStorage.getSignedUrl).mockResolvedValue('https://signed.url/receipt.jpg');

      const fakeFile = {
        buffer: Buffer.from('fake receipt image'),
        originalname: 'receipt.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const result = await service.createExpense(
        'user-alpha',
        {
          title: 'Whole Foods Market',
          amount: 2450.5,
          currency: 'INR',
          category: 'GROCERIES',
          date: '2026-11-20T10:30:00Z',
        },
        fakeFile
      );

      expect(mockStorage.uploadReceipt).toHaveBeenCalledWith(
        'user-alpha',
        'exp-001',
        fakeFile.buffer,
        'receipt.jpg',
        'image/jpeg'
      );
      expect(result.signedReceiptUrl).toBe('https://signed.url/receipt.jpg');
    });
  });

  describe('User Isolation and Access Control', () => {
    it('returns expense with signed URL for authorized owner', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockExpense);
      vi.mocked(mockStorage.getSignedUrl).mockResolvedValue('https://signed.url/receipt.jpg');

      const result = await service.getExpense('user-alpha', 'exp-001');
      expect(result.id).toBe('exp-001');
      expect(result.signedReceiptUrl).toBe('https://signed.url/receipt.jpg');
    });

    it('throws NotFoundError when querying another user expense', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.getExpense('user-beta', 'exp-001')).rejects.toThrow(
        NotFoundError
      );
      expect(mockRepo.findById).toHaveBeenCalledWith('user-beta', 'exp-001');
    });
  });

  describe('deleteExpense', () => {
    it('deletes receipt from storage and removes expense record', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockExpense);
      vi.mocked(mockStorage.deleteFile).mockResolvedValue(true);
      vi.mocked(mockRepo.delete).mockResolvedValue(mockExpense);

      await service.deleteExpense('user-alpha', 'exp-001');

      expect(mockStorage.deleteFile).toHaveBeenCalledWith(mockExpense.receiptPath);
      expect(mockRepo.delete).toHaveBeenCalledWith('user-alpha', 'exp-001');
    });

    it('throws NotFoundError if expense does not exist on delete', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.deleteExpense('user-alpha', 'exp-999')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('Analytics & Currency Separation', () => {
    it('fetches monthly analytics grouped by currency and calculates MoM trends', async () => {
      const mockAnalytics = {
        currency: 'INR',
        currentMonthTotal: 15400,
        previousMonthTotal: 12000,
        momChangeAmount: 3400,
        momChangePercentage: 28.33,
        averageDailySpending: 513.33,
        categoryBreakdown: [
          { category: 'GROCERIES' as const, totalAmount: 8500, count: 4, percentage: 55.19 },
          { category: 'FOOD' as const, totalAmount: 4500, count: 6, percentage: 29.22 },
        ],
        topCategories: [
          { category: 'GROCERIES' as const, totalAmount: 8500, count: 4, percentage: 55.19 },
        ],
        dailyTrends: [{ date: '2026-11-20', amount: 2450.5, count: 1 }],
        totalTransactionsCount: 10,
      };

      vi.mocked(mockRepo.getAnalytics).mockResolvedValue(mockAnalytics);

      const result = await service.getAnalytics('user-alpha', 11, 2026, 'INR');

      expect(mockRepo.getAnalytics).toHaveBeenCalledWith('user-alpha', 11, 2026, 'INR');
      expect(result.currentMonthTotal).toBe(15400);
      expect(result.momChangePercentage).toBe(28.33);
      expect(result.currency).toBe('INR');
    });
  });

  describe('Budget Management & Exceeded Warnings', () => {
    it('upserts a monthly category budget', async () => {
      vi.mocked(mockRepo.upsertBudget).mockResolvedValue(mockBudget);

      const result = await service.setBudget('user-alpha', {
        month: 11,
        year: 2026,
        amount: 15000,
        currency: 'INR',
        category: 'GROCERIES',
      });

      expect(mockRepo.upsertBudget).toHaveBeenCalledWith('user-alpha', {
        month: 11,
        year: 2026,
        amount: 15000,
        currency: 'INR',
        category: 'GROCERIES',
      });
      expect(result.amount.toNumber()).toBe(15000);
    });

    it('calculates remaining budget and detects budget exceeded scenario', async () => {
      const mockBudgetStatuses = [
        {
          ...mockBudget,
          spentAmount: 18000,
          remainingAmount: -3000,
          percentageConsumed: 120,
          isExceeded: true,
        },
      ];

      vi.mocked(mockRepo.getBudgets).mockResolvedValue(mockBudgetStatuses);

      const result = await service.getBudgets('user-alpha', {
        month: 11,
        year: 2026,
        currency: 'INR',
      });

      expect(result).toHaveLength(1);
      expect(result[0].spentAmount).toBe(18000);
      expect(result[0].remainingAmount).toBe(-3000);
      expect(result[0].percentageConsumed).toBe(120);
      expect(result[0].isExceeded).toBe(true);
    });

    it('deletes an existing budget', async () => {
      vi.mocked(mockRepo.deleteBudget).mockResolvedValue(mockBudget);

      await service.deleteBudget('user-alpha', 'bgt-001');
      expect(mockRepo.deleteBudget).toHaveBeenCalledWith('user-alpha', 'bgt-001');
    });

    it('throws NotFoundError when deleting non-existent budget', async () => {
      vi.mocked(mockRepo.deleteBudget).mockResolvedValue(null);

      await expect(service.deleteBudget('user-alpha', 'bgt-unknown')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
