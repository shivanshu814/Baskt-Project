import { Request, Response } from 'express';
import { ExecutionService } from '../execution.service';

export class HealthHandler {
  constructor(private executionService: ExecutionService) {}

  async getHealth(req: Request, res: Response): Promise<void> {
    const health = await this.executionService.getHealth();
    const status = health.healthy ? 200 : 503;
    res.status(status).json(health);
  }

  async getReadiness(req: Request, res: Response): Promise<void> {
    const health = await this.executionService.getHealth();
    const isReady = health.healthy;
    const status = isReady ? 200 : 503;
    res.status(status).json({ ready: isReady });
  }

  async getLiveness(req: Request, res: Response): Promise<void> {
    res.status(200).json({ alive: true });
  }
}