"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllQuestions = exports.getRandomQueue = exports.questions = void 0;
const lodash_1 = __importDefault(require("lodash"));
exports.questions = [
    // todo: persistent pokoje i potem nie losuje tych pytań co juz były
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
    "Gdzie pieniądze są za las?",
    "Jaką muzykę grałby twój zespół?",
    "Jaką chciałbyś mieć supermoc?",
    "Jaki film obejrzałeś najwięcej razy?",
    "O spełnienie jakiego marzenia poprosiłbyś złotą rybkę?",
    "Jaka jest pierwsza rzecz, którą robisz rano?",
    "Jedzenie, które wszyscy lubią, a ty nie?",
    "Co przedstawiał twój ostatni rysunek?",
    "Ile lat chciałbyś żyć?",
    "Na jaką stronę internetową najczęściej wchodzisz?",
    "Twój największy celebrity crush?",
    "Co przedstawia osatnie zdjęcie w Twojej galerii?",
    "Gdybyś mógł nauczyć się jednego języka w jeden dzień, jaki by to był?",
    "Gdybyś mógł zakazać jednej rzeczy w Polsce - co by to było?",
    "Ulubiony fanpage na FB?",
    "Na co masz teraz ochotę?",
    "Co kupisz, jeśli byłoby cię stać na wszystko?",
    "Wymyśl sobie jakąś ksywkę - jaka byłaby?",
    "Kto z was jest najbardziej agresywny?",
    "Twój sekretny ulubiony wykonawca?",
    "Twoje ulubione określenie na zioło?",
    "Jak nazwałbyś swojego psa?",
    "Oprócz loda, środa to dzień...?",
    // AGH
    "Jaka osoba na roku najbardziej działa ci na nerwy?",
    "Prowadzący którego nikt nie lubi oprócz ciebie?",
];
exports.getRandomQueue = (queueLength = 8) => {
    let q = lodash_1.default.shuffle(exports.questions);
    return q.slice(0, queueLength);
};
exports.getAllQuestions = () => {
    return lodash_1.default.shuffle(exports.questions);
};
