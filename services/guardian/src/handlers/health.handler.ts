import express from 'express';
import { GuardianService } from '../guardian.service';

export function createHealthRouter(guardian: GuardianService): express.Router {
  const router = express.Router();

  router.get('/health', (req, res) => {
    const health = guardian.getHealth();
    const status = health.healthy ? 200 : 503;
    res.status(status).json(health);
  });

  router.get('/status', (req, res) => {
    const status = guardian.getStatus();
    res.json(status);
  });

  return router;
}

