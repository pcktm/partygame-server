import {Router} from 'express';
import os from 'os';
import {PrismaClient} from '@prisma/client';

const db = new PrismaClient();
export const index = Router();

index.get('/', async (req, res) => {
  res.send({
    version: process.env.npm_package_version ?? 'unavailable',
    environment: process.env.NODE_ENV ?? 'development',
    uptime: process.uptime(),
    requestId: req.headers['x-request-id'] ?? '',
    questionCount: await db.question.count(),
  });
});

index.get('/decks', async (req, res) => {
  const decks = await db.deck.findMany({
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
    where: {
      language: req.query.lang as string ?? 'en',
    },
  });
  const ret = decks.map((d) => ({
    id: d.id,
    name: d.name,
    emoji: d.emoji,
    language: d.language,
    questionCount: d._count?.questions ?? 0,
  }));
  res.send(ret);
});
