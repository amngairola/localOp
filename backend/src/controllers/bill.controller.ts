import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { billService, BillService } from '../services/bill.service';
import { successResponse, createdResponse, noContentResponse } from '../utils/response';
import { CreateBillDto, UpdateBillDto, QueryBillDto, MarkBillPaidDto } from '../schemas/bill.schema';

export class BillController {
  constructor(private service: BillService = billService) {}

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const query = req.query as unknown as QueryBillDto;
    const result = await this.service.listBills(userId, query);
    successResponse(res, result.bills, 'Bills retrieved successfully', result.pagination);
  };

  summary = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const summary = await this.service.getSummary(userId);
    successResponse(res, summary, 'Bills summary retrieved successfully');
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const bill = await this.service.getBill(userId, id);
    successResponse(res, bill, 'Bill retrieved successfully');
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const dto = req.body as CreateBillDto;
    const file = req.file;
    const bill = await this.service.createBill(userId, dto, file);
    createdResponse(res, bill, 'Bill created successfully');
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dto = req.body as UpdateBillDto;
    const bill = await this.service.updateBill(userId, id, dto);
    successResponse(res, bill, 'Bill updated successfully');
  };

  markPaid = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dto = req.body as MarkBillPaidDto;
    const result = await this.service.markPaid(userId, id, dto);
    successResponse(res, result, 'Bill marked as paid successfully');
  };

  uploadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded', code: 'FILE_REQUIRED' });
      return;
    }
    const bill = await this.service.uploadAttachment(userId, id, file);
    successResponse(res, bill, 'Invoice attachment uploaded successfully');
  };

  getAttachmentUrl = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const signedUrl = await this.service.getAttachmentSignedUrl(userId, id);
    successResponse(res, { signedUrl }, 'Signed download URL generated successfully');
  };

  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await this.service.deleteBill(userId, id);
    noContentResponse(res);
  };
}

export const billController = new BillController();
