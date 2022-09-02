import lodash from 'lodash';
import db from './database';

type RequestOptions = {
  decks: string[];
  minPlayers?: number;
};

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
