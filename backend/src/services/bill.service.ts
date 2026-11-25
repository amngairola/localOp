import { billRepository, BillRepository } from '../repositories/bill.repository';
import { supabaseStorageService, SupabaseStorageService } from '../storage/supabaseStorage';
import { CreateBillDto, UpdateBillDto, QueryBillDto, MarkBillPaidDto } from '../schemas/bill.schema';
import { NotFoundError, ConflictError } from '../utils/errors';
import { Bill, BillingCycle } from '@prisma/client';
import { addMonths, addYears, addWeeks } from 'date-fns';

export class BillService {
  constructor(
    private repo: BillRepository = billRepository,
    private storage: SupabaseStorageService = supabaseStorageService
  ) {}

  async listBills(userId: string, query: QueryBillDto) {
    const { bills, total } = await this.repo.findMany(userId, query);

    const now = new Date();
    const enriched = bills.map((bill) => {
      const isOverdue = bill.status === 'UNPAID' && new Date(bill.dueDate) < now;
      return {
        ...bill,
        isOverdue,
      };
    });

    return {
      bills: enriched,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
        hasPrev: query.page > 1,
      },
    };
  }

  async getBill(userId: string, id: string): Promise<Bill & { isOverdue: boolean; signedUrl?: string | null }> {
    const bill = await this.repo.findById(userId, id);
    if (!bill) {
      throw new NotFoundError('Bill');
    }

    const now = new Date();
    const isOverdue = bill.status === 'UNPAID' && new Date(bill.dueDate) < now;

    let signedUrl: string | null = null;
    if (bill.attachmentPath) {
      signedUrl = await this.storage.getSignedUrl(bill.attachmentPath);
    }

    return {
      ...bill,
      isOverdue,
      signedUrl: signedUrl || bill.attachmentUrl,
    };
  }

  async createBill(
    userId: string,
    dto: CreateBillDto,
    file?: Express.Multer.File
  ): Promise<Bill> {
    const tempId = crypto.randomUUID();
    let attachment: { path: string; url?: string } | undefined;

    if (file) {
      const uploadRes = await this.storage.uploadInvoice(
        userId,
        tempId,
        file.buffer,
        file.originalname,
        file.mimetype
      );
      attachment = { path: uploadRes.storagePath };
    }

    return this.repo.create(userId, dto, undefined, attachment);
  }

  async updateBill(userId: string, id: string, dto: UpdateBillDto): Promise<Bill> {
    const updated = await this.repo.update(userId, id, dto);
    if (!updated) {
      throw new NotFoundError('Bill');
    }
    return updated;
  }

  async markPaid(
    userId: string,
    id: string,
    dto: MarkBillPaidDto
  ): Promise<{ paidBill: Bill; nextBill?: Bill }> {
    const bill = await this.repo.findById(userId, id);
    if (!bill) {
      throw new NotFoundError('Bill');
    }

    if (bill.status === 'PAID') {
      throw new ConflictError('Bill is already marked as paid');
    }

    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    let nextBillData:
      | {
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
      | undefined;

    if (bill.isRecurring && bill.billingCycle) {
      const nextDueDate = this.calculateNextDueDate(new Date(bill.dueDate), bill.billingCycle);
      nextBillData = {
        title: bill.title,
        description: bill.description,
        provider: bill.provider,
        amount: Number(bill.amount),
        currency: bill.currency,
        dueDate: nextDueDate,
        category: bill.category,
        isRecurring: true,
        billingCycle: bill.billingCycle,
        notes: bill.notes,
      };
    }

    return this.repo.markPaid(userId, id, paymentDate, nextBillData);
  }

  async uploadAttachment(
    userId: string,
    id: string,
    file: Express.Multer.File
  ): Promise<Bill> {
    const bill = await this.repo.findById(userId, id);
    if (!bill) {
      throw new NotFoundError('Bill');
    }

    const uploadRes = await this.storage.uploadInvoice(
      userId,
      id,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const signedUrl = await this.storage.getSignedUrl(uploadRes.storagePath);

    const updated = await this.repo.updateAttachment(
      userId,
      id,
      uploadRes.storagePath,
      signedUrl || undefined
    );

    if (!updated) {
      throw new NotFoundError('Bill');
    }

    return updated;
  }

  async getAttachmentSignedUrl(userId: string, id: string): Promise<string> {
    const bill = await this.repo.findById(userId, id);
    if (!bill || !bill.attachmentPath) {
      throw new NotFoundError('Invoice attachment');
    }

    const url = await this.storage.getSignedUrl(bill.attachmentPath);
    if (!url) {
      throw new NotFoundError('Invoice signed URL');
    }

    return url;
  }

  async deleteBill(userId: string, id: string): Promise<void> {
    const bill = await this.repo.findById(userId, id);
    if (!bill) {
      throw new NotFoundError('Bill');
    }

    if (bill.attachmentPath) {
      await this.storage.deleteFile(bill.attachmentPath);
    }

    await this.repo.delete(userId, id);
  }

  async getSummary(userId: string) {
    return this.repo.getSummary(userId);
  }

  private calculateNextDueDate(currentDueDate: Date, cycle: BillingCycle): Date {
    switch (cycle) {
      case 'WEEKLY':
        return addWeeks(currentDueDate, 1);
      case 'MONTHLY':
        return addMonths(currentDueDate, 1);
      case 'QUARTERLY':
        return addMonths(currentDueDate, 3);
      case 'YEARLY':
        return addYears(currentDueDate, 1);
      case 'CUSTOM':
      default:
        return addMonths(currentDueDate, 1);
    }
  }
}

export const billService = new BillService();
