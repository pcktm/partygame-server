import {PrismaClient} from '@prisma/client';
import lodash from 'lodash';

type RequestOptions = {
  decks: string[];
  minPlayers?: number;
};

const db = new PrismaClient();

export const getShuffledQuestions = async (options: RequestOptions) => {
  const questions = await db.question.findMany({
    where: {
      deckId: {
        in: options.decks,
      },
      minPlayers: {
        lte: options.minPlayers ?? 0,
      },
    },
  });
  return lodash.shuffle(questions);
};
