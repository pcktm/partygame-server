import lodash from 'lodash';

export const questions = [
  "Jaki jest twój ulubiony zapach?",
  "Najważniejszą rzeczą w potencjalnym partnerze jest?",
  "Twoja ulubiona postać z bajki?",
  "Musisz zaśpiewać karaoke, jaką piosenkę wybierasz?",
  "Jeśli miałbyś stać się sławny, to za co?",
  "Możesz jeść tylko jedno danie do końca życia, jakie?",
  "Jaki byłby tytuł twojej autobiografii?",
  "Jaki jest twój największy lęk?",
  "Chcesz upiec najgorsze ciastka pod słońcem, jaki wybierasz smak?",
  "Jakiego emoji używasz najczęściej?",
  "Dokończ zdanie: Chciałabym, żeby każdy mógł...",
  "Oprócz owadów i pająków, jakie zwierzęta najbardziej Cię denerwują?",
]

export const getRandomQueue = (queueLength = 8) => {
  let q = lodash.shuffle(questions);
  return q.slice(0, queueLength);
}