// eslint-disable-next-line max-len
const emojis = '😀 😄 😁 😆 😅 😂 🥲 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😚 😋 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😔 😣 😖 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😬 🙄 😯 😲 🥱 😴 🤤 😵 🤐 🥴 🤢 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👻 💀 ☠️ 👽 😺 😸 😻 😼 😽 🙀 😿 😾'.split(' ');

export const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];
