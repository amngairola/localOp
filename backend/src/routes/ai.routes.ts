import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { errorResponse } from '../utils/response';

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.use(aiRateLimiter);

aiRouter.post('/chat', (_req, res) => {
  errorResponse(res, 501, 'AI chat endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
aiRouter.get('/conversations', (_req, res) => {
  errorResponse(res, 501, 'AI conversations endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
aiRouter.get('/conversations/:id', (_req, res) => {
  errorResponse(res, 501, 'AI conversations endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
aiRouter.delete('/conversations/:id', (_req, res) => {
  errorResponse(res, 501, 'AI conversations endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
aiRouter.post('/actions/:id/confirm', (_req, res) => {
  errorResponse(res, 501, 'AI actions endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
aiRouter.post('/actions/:id/reject', (_req, res) => {
  errorResponse(res, 501, 'AI actions endpoint not yet implemented', 'NOT_IMPLEMENTED');
});
