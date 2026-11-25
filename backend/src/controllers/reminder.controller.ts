import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { reminderService, ReminderService } from '../services/reminder.service';
import { successResponse, createdResponse, noContentResponse } from '../utils/response';
import { CreateReminderDto, UpdateReminderDto, QueryReminderDto } from '../schemas/reminder.schema';

export class ReminderController {
  constructor(private service: ReminderService = reminderService) {}

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const query = req.query as unknown as QueryReminderDto;
    const result = await this.service.listReminders(userId, query);
    successResponse(res, result.reminders, 'Reminders retrieved successfully', result.pagination);
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reminder = await this.service.getReminder(userId, id);
    successResponse(res, reminder, 'Reminder retrieved successfully');
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const dto = req.body as CreateReminderDto;
    const reminder = await this.service.createReminder(userId, dto);
    createdResponse(res, reminder, 'Reminder created successfully');
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dto = req.body as UpdateReminderDto;
    const reminder = await this.service.updateReminder(userId, id, dto);
    successResponse(res, reminder, 'Reminder updated successfully');
  };

  complete = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.completeReminder(userId, id);
    successResponse(res, result, 'Reminder marked as completed');
  };

  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await this.service.deleteReminder(userId, id);
    noContentResponse(res);
  };
}

export const reminderController = new ReminderController();
