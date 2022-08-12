import {Router} from 'express';
import os from 'os';

export const index = Router();

index.get('/', (req, res) => {
  res.send({
    name: 'Martyr',
    version: '0.0.1',
    environment: process.env.NODE_ENV ?? 'development',
    uptime: process.uptime(),
  });
});
