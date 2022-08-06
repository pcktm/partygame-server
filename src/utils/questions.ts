export const questions = [
  "What is your favorite scent?",
  "The most important thing about a potential partner is?",
  "Your favorite fairy tale character?",
  "You have to sing karaoke, what song do you choose?",
  "Jeśli miałbyś stać się sławny, to za co?",
  "You can only eat one dish for the rest of your life, which one?",
  "What would be the title of your autobiography?",
  "What is your biggest fear?",
  "Want to bake the worst cookies under the sun, what flavor do you choose?",
  "What emoji do you use most often?",
  "Complete the sentence: I wish everyone could...",
  "Apart from insects and spiders, what animals annoy you the most?"
]

export const getRandomQueue = () => {
  let q = Array.from(questions);
  for (let i = q.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [q[i], q[j]] = [q[j], q[i]];
  }
  return q;
}