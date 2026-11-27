import { prisma } from '../config/database';
import { Expense, Budget, Prisma, ExpenseCategory, PaymentMethod } from '@prisma/client';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  QueryExpenseDto,
  SetBudgetDto,
  QueryBudgetDto,
} from '../schemas/expense.schema';

export interface CategorySpending {
  category: ExpenseCategory;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface DailySpending {
  date: string; // YYYY-MM-DD
  amount: number;
  count: number;
}

export interface ExpenseAnalytics {
  currency: string;
  currentMonthTotal: number;
  previousMonthTotal: number;
  momChangeAmount: number;
  momChangePercentage: number;
  averageDailySpending: number;
  categoryBreakdown: CategorySpending[];
  topCategories: CategorySpending[];
  dailyTrends: DailySpending[];
  totalTransactionsCount: number;
}

export interface BudgetStatus extends Budget {
  spentAmount: number;
  remainingAmount: number;
  percentageConsumed: number;
  isExceeded: boolean;
}

export class ExpenseRepository {
  async findMany(
    userId: string,
    query: QueryExpenseDto
  ): Promise<{ expenses: Expense[]; total: number }> {
    const where: Prisma.ExpenseWhereInput = {
      userId,
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }

    if (query.currency) {
      where.currency = query.currency;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { merchant: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip,
        take,
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total };
  }

  async findById(userId: string, id: string): Promise<Expense | null> {
    return prisma.expense.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async create(
    userId: string,
    dto: CreateExpenseDto,
    receiptPath?: string | null
  ): Promise<Expense> {
    return prisma.expense.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description ?? null,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency,
        category: dto.category,
        date: new Date(dto.date),
        paymentMethod: dto.paymentMethod ?? null,
        merchant: dto.merchant ?? null,
        notes: dto.notes ?? null,
        receiptPath: receiptPath ?? null,
        tags: dto.tags ?? [],
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateExpenseDto
  ): Promise<Expense | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    const data: Prisma.ExpenseUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.paymentMethod !== undefined) data.paymentMethod = dto.paymentMethod;
    if (dto.merchant !== undefined) data.merchant = dto.merchant;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.tags !== undefined) data.tags = dto.tags;

    return prisma.expense.update({
      where: { id },
      data,
    });
  }

  async updateReceipt(
    userId: string,
    id: string,
    receiptPath: string
  ): Promise<Expense | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    return prisma.expense.update({
      where: { id },
      data: { receiptPath },
    });
  }

  async delete(userId: string, id: string): Promise<Expense | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    return prisma.expense.delete({
      where: { id },
    });
  }

  async getAnalytics(
    userId: string,
    month: number,
    year: number,
    currency: string = 'INR'
  ): Promise<ExpenseAnalytics> {
    // Current month boundaries
    const startOfCurrentMonth = new Date(year, month - 1, 1);
    const endOfCurrentMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Previous month boundaries
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1);
    const endOfPrevMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

    // Fetch transactions for both months scoped to currency
    const [currentExpenses, prevExpenses] = await Promise.all([
      prisma.expense.findMany({
        where: {
          userId,
          currency,
          date: {
            gte: startOfCurrentMonth,
            lte: endOfCurrentMonth,
          },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.expense.findMany({
        where: {
          userId,
          currency,
          date: {
            gte: startOfPrevMonth,
            lte: endOfPrevMonth,
          },
        },
      }),
    ]);

    const currentMonthTotal = currentExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );
    const previousMonthTotal = prevExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    const momChangeAmount = currentMonthTotal - previousMonthTotal;
    const momChangePercentage =
      previousMonthTotal > 0
        ? Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 10000) / 100
        : currentMonthTotal > 0
        ? 100
        : 0;

    // Days in current month for daily average
    const daysInMonth = endOfCurrentMonth.getDate();
    const averageDailySpending =
      Math.round((currentMonthTotal / daysInMonth) * 100) / 100;

    // Category aggregation
    const catMap = new Map<ExpenseCategory, { amount: number; count: number }>();
    for (const exp of currentExpenses) {
      const prev = catMap.get(exp.category) || { amount: 0, count: 0 };
      catMap.set(exp.category, {
        amount: prev.amount + Number(exp.amount),
        count: prev.count + 1,
      });
    }

    const categoryBreakdown: CategorySpending[] = Array.from(catMap.entries()).map(
      ([category, val]) => ({
        category,
        totalAmount: Math.round(val.amount * 100) / 100,
        count: val.count,
        percentage:
          currentMonthTotal > 0
            ? Math.round((val.amount / currentMonthTotal) * 10000) / 100
            : 0,
      })
    );

    // Sort categories by totalAmount descending
    categoryBreakdown.sort((a, b) => b.totalAmount - a.totalAmount);
    const topCategories = categoryBreakdown.slice(0, 5);

    // Daily trends aggregation
    const dailyMap = new Map<string, { amount: number; count: number }>();
    for (const exp of currentExpenses) {
      const dayKey = exp.date.toISOString().slice(0, 10);
      const prev = dailyMap.get(dayKey) || { amount: 0, count: 0 };
      dailyMap.set(dayKey, {
        amount: prev.amount + Number(exp.amount),
        count: prev.count + 1,
      });
    }

    const dailyTrends: DailySpending[] = Array.from(dailyMap.entries()).map(
      ([date, val]) => ({
        date,
        amount: Math.round(val.amount * 100) / 100,
        count: val.count,
      })
    );

    return {
      currency,
      currentMonthTotal: Math.round(currentMonthTotal * 100) / 100,
      previousMonthTotal: Math.round(previousMonthTotal * 100) / 100,
      momChangeAmount: Math.round(momChangeAmount * 100) / 100,
      momChangePercentage,
      averageDailySpending,
      categoryBreakdown,
      topCategories,
      dailyTrends,
      totalTransactionsCount: currentExpenses.length,
    };
  }

  // --- Budget Management Repository Operations ---

  async upsertBudget(userId: string, dto: SetBudgetDto): Promise<Budget> {
    const category = dto.category ?? null;

    return prisma.budget.upsert({
      where: {
        userId_month_year_category: {
          userId,
          month: dto.month,
          year: dto.year,
          category: category as any,
        },
      },
      update: {
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency,
      },
      create: {
        userId,
        month: dto.month,
        year: dto.year,
        category: category ?? null,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency,
      },
    });
  }

  async getBudgets(
    userId: string,
    query: QueryBudgetDto
  ): Promise<BudgetStatus[]> {
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();
    const currency = query.currency ?? 'INR';

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month,
        year,
        currency,
      },
      orderBy: [{ category: 'asc' }],
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch month's expenses for calculating spent amounts
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        currency,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        amount: true,
        category: true,
      },
    });

    const totalSpentOverall = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const categorySpentMap = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      categorySpentMap.set(
        e.category,
        (categorySpentMap.get(e.category) || 0) + Number(e.amount)
      );
    }

    return budgets.map((b) => {
      const budgetAmount = Number(b.amount);
      const spent = b.category
        ? categorySpentMap.get(b.category) || 0
        : totalSpentOverall;
      const remainingAmount = Math.round((budgetAmount - spent) * 100) / 100;
      const percentageConsumed =
        budgetAmount > 0
          ? Math.round((spent / budgetAmount) * 10000) / 100
          : 0;

      return {
        ...b,
        spentAmount: Math.round(spent * 100) / 100,
        remainingAmount,
        percentageConsumed,
        isExceeded: spent > budgetAmount,
      };
    });
  }

  async deleteBudget(userId: string, id: string): Promise<Budget | null> {
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    return prisma.budget.delete({
      where: { id },
    });
  }
}

export const expenseRepository = new ExpenseRepository();
