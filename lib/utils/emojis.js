"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomEmoji = void 0;
var emojis = "😀 😄 😁 😆 😅 😂 🥲 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😚 😋 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😔 😣 😖 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😬 🙄 😯 😲 🥱 😴 🤤 😵 🤐 🥴 🤢 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👻 💀 ☠️ 👽 😺 😸 😻 😼 😽 🙀 😿 😾".split(' ');
exports.getRandomEmoji = () => {
    return emojis[Math.floor(Math.random() * emojis.length)];
};
