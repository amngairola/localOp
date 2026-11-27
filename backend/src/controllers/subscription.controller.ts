import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import {
  subscriptionService,
  SubscriptionService,
} from '../services/subscription.service';
import {
  successResponse,
  createdResponse,
  noContentResponse,
} from '../utils/response';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  QuerySubscriptionDto,
  CancelSubscriptionDto,
  RenewSubscriptionDto,
} from '../schemas/subscription.schema';

export class SubscriptionController {
  constructor(private service: SubscriptionService = subscriptionService) {}

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const query = req.query as unknown as QuerySubscriptionDto;
    const result = await this.service.listSubscriptions(userId, query);
    successResponse(
      res,
      result.subscriptions,
      'Subscriptions retrieved successfully',
      result.pagination
    );
  };

  summary = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const summary = await this.service.getSummary(userId);
    successResponse(res, summary, 'Subscription summary retrieved successfully');
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const subscription = await this.service.getSubscription(userId, id);
    successResponse(res, subscription, 'Subscription retrieved successfully');
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const dto = req.body as CreateSubscriptionDto;
    const subscription = await this.service.createSubscription(userId, dto);
    createdResponse(res, subscription, 'Subscription created successfully');
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dto = req.body as UpdateSubscriptionDto;
    const subscription = await this.service.updateSubscription(userId, id, dto);
    successResponse(res, subscription, 'Subscription updated successfully');
  };

  pause = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const subscription = await this.service.pauseSubscription(userId, id);
    successResponse(res, subscription, 'Subscription paused successfully');
  };

  resume = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const subscription = await this.service.resumeSubscription(userId, id);
    successResponse(res, subscription, 'Subscription resumed successfully');
  };

  cancel = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dto = req.body as CancelSubscriptionDto;
    const subscription = await this.service.cancelSubscription(userId, id, dto);
    successResponse(res, subscription, 'Subscription cancelled successfully');
  };

  renew = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dto = req.body as RenewSubscriptionDto;
    const subscription = await this.service.renewSubscription(userId, id, dto);
    successResponse(res, subscription, 'Subscription renewed successfully');
  };

  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await this.service.deleteSubscription(userId, id);
    noContentResponse(res);
  };

  createBill = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const bill = await this.service.createBillFromRenewal(userId, id);
    createdResponse(res, bill, 'Bill generated from subscription renewal successfully');
  };
}

export const subscriptionController = new SubscriptionController();
