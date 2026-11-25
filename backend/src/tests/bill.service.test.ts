import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillService } from '../services/bill.service';
import { BillRepository } from '../repositories/bill.repository';
import { SupabaseStorageService } from '../storage/supabaseStorage';
import { NotFoundError, ConflictError } from '../utils/errors';
import { Bill, Prisma } from '@prisma/client';

describe('BillService', () => {
  let mockRepo: BillRepository;
  let mockStorage: SupabaseStorageService;
  let service: BillService;

  const mockBill: Bill = {
    id: 'bill-101',
    userId: 'user-alpha',
    title: 'Broadband Fiber',
    description: 'High speed internet',
    provider: 'JioFiber',
    amount: new Prisma.Decimal(1180),
    currency: 'INR',
    dueDate: new Date('2026-12-05T00:00:00Z'),
    paymentDate: null,
    category: 'INTERNET',
    status: 'UNPAID',
    isRecurring: true,
    billingCycle: 'MONTHLY',
    notes: 'Auto-debit setup',
    attachmentUrl: null,
    attachmentPath: 'invoices/user-alpha/bill-101/invoice.pdf',
    documentId: null,
    invoiceNumber: 'INV-2026-11-01',
    parentId: null,
    createdAt: new Date('2026-11-20T00:00:00Z'),
    updatedAt: new Date('2026-11-20T00:00:00Z'),
  };

  beforeEach(() => {
    mockRepo = {
      findMany: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateAttachment: vi.fn(),
      markPaid: vi.fn(),
      delete: vi.fn(),
      getSummary: vi.fn(),
    } as unknown as BillRepository;

    mockStorage = {
      uploadInvoice: vi.fn(),
      getSignedUrl: vi.fn(),
      deleteFile: vi.fn(),
    } as unknown as SupabaseStorageService;

    service = new BillService(mockRepo, mockStorage);
  });

  describe('createBill', () => {
    it('creates a bill with valid data for authenticated user', async () => {
      vi.mocked(mockRepo.create).mockResolvedValue(mockBill);

      const result = await service.createBill('user-alpha', {
        title: 'Broadband Fiber',
        amount: 1180,
        currency: 'INR',
        dueDate: '2026-12-05T00:00:00Z',
        category: 'INTERNET',
        status: 'UNPAID',
        isRecurring: true,
        billingCycle: 'MONTHLY',
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        'user-alpha',
        expect.objectContaining({ title: 'Broadband Fiber', amount: 1180 }),
        undefined,
        undefined
      );
      expect(result).toEqual(mockBill);
    });
  });

  describe('getBill & User Data Isolation', () => {
    it('returns the bill when owned by the requesting user', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockBill);
      vi.mocked(mockStorage.getSignedUrl).mockResolvedValue('https://signed-url.example/doc.pdf');

      const result = await service.getBill('user-alpha', 'bill-101');
      expect(result.id).toBe('bill-101');
      expect(mockRepo.findById).toHaveBeenCalledWith('user-alpha', 'bill-101');
      expect(result.signedUrl).toBe('https://signed-url.example/doc.pdf');
    });

    it('rejects cross-user access: throws NotFoundError if bill belongs to someone else', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.getBill('user-attacker', 'bill-101')).rejects.toThrow(NotFoundError);
      expect(mockRepo.findById).toHaveBeenCalledWith('user-attacker', 'bill-101');
    });
  });

  describe('Dynamic Overdue Calculation', () => {
    it('calculates isOverdue = true for unpaid bills past due date', async () => {
      const pastDueBill: Bill = {
        ...mockBill,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        status: 'UNPAID',
      };
      vi.mocked(mockRepo.findMany).mockResolvedValue({ bills: [pastDueBill], total: 1 });

      const result = await service.listBills('user-alpha', { page: 1, limit: 10 } as any);
      expect(result.bills[0].isOverdue).toBe(true);
    });

    it('calculates isOverdue = false for paid bills even if due date is in the past', async () => {
      const paidPastDueBill: Bill = {
        ...mockBill,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'PAID',
      };
      vi.mocked(mockRepo.findMany).mockResolvedValue({ bills: [paidPastDueBill], total: 1 });

      const result = await service.listBills('user-alpha', { page: 1, limit: 10 } as any);
      expect(result.bills[0].isOverdue).toBe(false);
    });
  });

  describe('markPaid, Duplicate Prevention & Recurrence Generation', () => {
    it('marks unpaid recurring bill as paid and generates the next monthly bill', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockBill);

      const paidBill: Bill = {
        ...mockBill,
        status: 'PAID',
        paymentDate: new Date('2026-12-04T12:00:00Z'),
      };
      const nextBill: Bill = {
        ...mockBill,
        id: 'bill-102',
        dueDate: new Date('2027-01-05T00:00:00Z'), // 1 month later
        parentId: 'bill-101',
      };

      vi.mocked(mockRepo.markPaid).mockResolvedValue({ paidBill, nextBill });

      const result = await service.markPaid('user-alpha', 'bill-101', {
        paymentDate: '2026-12-04T12:00:00Z',
      });

      expect(mockRepo.markPaid).toHaveBeenCalledWith(
        'user-alpha',
        'bill-101',
        new Date('2026-12-04T12:00:00Z'),
        expect.objectContaining({
          title: 'Broadband Fiber',
          isRecurring: true,
          billingCycle: 'MONTHLY',
        })
      );
      expect(result.paidBill.status).toBe('PAID');
      expect(result.nextBill).toBeDefined();
    });

    it('prevents duplicate payment: throws ConflictError when bill is already paid', async () => {
      const alreadyPaidBill: Bill = {
        ...mockBill,
        status: 'PAID',
        paymentDate: new Date('2026-12-01T10:00:00Z'),
      };
      vi.mocked(mockRepo.findById).mockResolvedValue(alreadyPaidBill);

      await expect(service.markPaid('user-alpha', 'bill-101', {})).rejects.toThrow(ConflictError);
      expect(mockRepo.markPaid).not.toHaveBeenCalled();
    });
  });

  describe('deleteBill & Attachment Clean up', () => {
    it('deletes bill and cleans up user storage attachment', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockBill);
      vi.mocked(mockRepo.delete).mockResolvedValue(mockBill);
      vi.mocked(mockStorage.deleteFile).mockResolvedValue(true);

      await expect(service.deleteBill('user-alpha', 'bill-101')).resolves.not.toThrow();
      expect(mockStorage.deleteFile).toHaveBeenCalledWith('invoices/user-alpha/bill-101/invoice.pdf');
      expect(mockRepo.delete).toHaveBeenCalledWith('user-alpha', 'bill-101');
    });

    it('denies delete for unauthorized users', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.deleteBill('attacker', 'bill-101')).rejects.toThrow(NotFoundError);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('Invoice Attachment Signed URL', () => {
    it('generates a signed download URL only for authorized owner', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(mockBill);
      vi.mocked(mockStorage.getSignedUrl).mockResolvedValue('https://supabase.co/signed/invoice.pdf');

      const url = await service.getAttachmentSignedUrl('user-alpha', 'bill-101');
      expect(url).toBe('https://supabase.co/signed/invoice.pdf');
      expect(mockStorage.getSignedUrl).toHaveBeenCalledWith('invoices/user-alpha/bill-101/invoice.pdf');
    });

    it('rejects signed URL generation if bill is not found for the user', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.getAttachmentSignedUrl('intruder', 'bill-101')).rejects.toThrow(NotFoundError);
    });
  });
});
