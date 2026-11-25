import { prisma } from '../config/database';
import { Bill, Prisma } from '@prisma/client';
import { CreateBillDto, UpdateBillDto, QueryBillDto } from '../schemas/bill.schema';

export class BillRepository {
  async findMany(
    userId: string,
    query: QueryBillDto
  ): Promise<{ bills: Bill[]; total: number }> {
    const where: Prisma.BillWhereInput = {
      userId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.isRecurring !== undefined) {
      where.isRecurring = query.isRecurring;
    }

    if (query.startDate || query.endDate) {
      where.dueDate = {};
      if (query.startDate) {
        where.dueDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.dueDate.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { provider: { contains: query.search, mode: 'insensitive' } },
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      }),
      prisma.bill.count({ where }),
    ]);

    return { bills, total };
  }

  async findById(userId: string, id: string): Promise<Bill | null> {
    return prisma.bill.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async create(
    userId: string,
    data: CreateBillDto,
    parentId?: string,
    attachment?: { path: string; url?: string }
  ): Promise<Bill> {
    return prisma.bill.create({
      data: {
        userId,
        title: data.title,
        description: data.description ?? null,
        provider: data.provider ?? null,
        amount: new Prisma.Decimal(data.amount),
        currency: data.currency,
        dueDate: new Date(data.dueDate),
        category: data.category,
        status: data.status,
        isRecurring: data.isRecurring,
        billingCycle: data.billingCycle ?? null,
        invoiceNumber: data.invoiceNumber ?? null,
        notes: data.notes ?? null,
        parentId: parentId ?? null,
        attachmentPath: attachment?.path ?? null,
        attachmentUrl: attachment?.url ?? null,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: UpdateBillDto
  ): Promise<Bill | null> {
    const existing = await this.findById(userId, id);
    if (!existing) {
      return null;
    }

    const updateData: Prisma.BillUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.category !== undefined) updateData.category = data.category;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
    if (data.billingCycle !== undefined) updateData.billingCycle = data.billingCycle;
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.bill.update({
      where: { id },
      data: updateData,
    });
  }

  async updateAttachment(
    userId: string,
    id: string,
    attachmentPath: string,
    attachmentUrl?: string
  ): Promise<Bill | null> {
    const existing = await this.findById(userId, id);
    if (!existing) {
      return null;
    }

    return prisma.bill.update({
      where: { id },
      data: {
        attachmentPath,
        attachmentUrl: attachmentUrl ?? existing.attachmentUrl,
      },
    });
  }

  async markPaid(
    userId: string,
    id: string,
    paymentDate: Date,
    nextBillData?: {
      title: string;
      description?: string | null;
      provider?: string | null;
      amount: number;
      currency: string;
      dueDate: Date;
      category: any;
      isRecurring: boolean;
      billingCycle: any;
      notes?: string | null;
    }
  ): Promise<{ paidBill: Bill; nextBill?: Bill }> {
    return prisma.$transaction(async (tx) => {
      const paidBill = await tx.bill.update({
        where: { id },
        data: {
          status: 'PAID',
          paymentDate,
        },
      });

      let nextBill: Bill | undefined;
      if (nextBillData) {
        nextBill = await tx.bill.create({
          data: {
            userId,
            title: nextBillData.title,
            description: nextBillData.description ?? null,
            provider: nextBillData.provider ?? null,
            amount: new Prisma.Decimal(nextBillData.amount),
            currency: nextBillData.currency,
            dueDate: nextBillData.dueDate,
            category: nextBillData.category,
            status: 'UNPAID',
            isRecurring: true,
            billingCycle: nextBillData.billingCycle,
            notes: nextBillData.notes ?? null,
            parentId: id,
          },
        });
      }

      return { paidBill, nextBill };
    });
  }

  async delete(userId: string, id: string): Promise<Bill | null> {
    const existing = await this.findById(userId, id);
    if (!existing) {
      return null;
    }

    return prisma.bill.delete({
      where: { id },
    });
  }

  async getSummary(userId: string): Promise<{
    unpaidCount: number;
    unpaidAmount: number;
    overdueCount: number;
    overdueAmount: number;
    paidThisMonthAmount: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [unpaidBills, overdueBills, paidThisMonth] = await Promise.all([
      prisma.bill.findMany({
        where: { userId, status: 'UNPAID' },
        select: { amount: true, dueDate: true },
      }),
      prisma.bill.findMany({
        where: { userId, status: 'UNPAID', dueDate: { lt: now } },
        select: { amount: true },
      }),
      prisma.bill.findMany({
        where: {
          userId,
          status: 'PAID',
          paymentDate: { gte: startOfMonth },
        },
        select: { amount: true },
      }),
    ]);

    const unpaidAmount = unpaidBills.reduce((acc, b) => acc + Number(b.amount), 0);
    const overdueAmount = overdueBills.reduce((acc, b) => acc + Number(b.amount), 0);
    const paidThisMonthAmount = paidThisMonth.reduce((acc, b) => acc + Number(b.amount), 0);

    return {
      unpaidCount: unpaidBills.length,
      unpaidAmount,
      overdueCount: overdueBills.length,
      overdueAmount,
      paidThisMonthAmount,
    };
  }
}

export const billRepository = new BillRepository();
