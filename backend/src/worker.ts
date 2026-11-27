import { notificationJobProcessor } from './jobs/notificationJobProcessor';
import { logger } from './utils/logger';

async function runWorker() {
  logger.info('Starting standalone LifeOps background worker...');

  const intervalMinutes = 5;
  logger.info(`Worker scheduled to run every ${intervalMinutes} minutes.`);

  const execute = async () => {
    try {
      logger.info('Executing scheduled notification sweep...');
      const result = await notificationJobProcessor.processAllNotifications();
      logger.info({ result }, 'Scheduled sweep complete');
    } catch (err) {
      logger.error({ err }, 'Error in worker execution loop');
    }
  };

  // Initial immediate execution
  await execute();

  // Recurring loop
  setInterval(execute, intervalMinutes * 60 * 1000);
}

runWorker().catch((err) => {
  logger.error({ err }, 'Worker process fatal error');
  process.exit(1);
});
