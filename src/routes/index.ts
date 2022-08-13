import {Router} from 'express';
import os from 'os';
import {questions} from '../utils/questions';

export const index = Router();

index.get('/', (req, res) => {
  res.send({
    version: '0.0.1',
    environment: process.env.NODE_ENV ?? 'development',
    uptime: process.uptime(),
    requestId: req.headers['x-request-id'] ?? '',
    questionCount: questions.length,
  });
});
