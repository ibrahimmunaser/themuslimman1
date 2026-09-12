import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const en = JSON.parse(
  fs.readFileSync(path.join(__dirname, "en-qz-1-25.json"), "utf8")
);

function build(part, translations) {
  const src = en[String(part)];
  const questions = src.questions.map((q, i) => {
    const t = translations[i];
    if (!t) throw new Error(`Missing translation part ${part} Q${i + 1}`);
    if (t.o.length !== q.options.length) {
      throw new Error(`Option count mismatch part ${part} Q${i + 1}`);
    }
    const ci = q.options.indexOf(q.correct_answer);
    if (ci < 0) throw new Error(`EN correct not found part ${part} Q${i + 1}`);
    return {
      question_number: q.question_number,
      question: t.q,
      options: t.o,
      correct_answer: t.o[ci],
      explanation: t.e,
      tags: q.tags,
      id: q.id,
    };
  });
  return { part, question_count: src.question_count, questions };
}

const out = {};

out["11"] = build(11, [
  {
    q: "Selon le texte, jusqu'à quel ancêtre la lignée du Prophète ﷺ est-elle admise d'un commun accord par les principaux savants de la généalogie ?",
    o: ["Adnan", "Ismail", "Ibrahim", "Adam"],
    e: "Le texte indique que le premier niveau remonte son ascendance jusqu'à Adnan et que cette partie est admise d'un commun accord par les principaux savants de la généalogie.",
  },
  {
    q: "Sur quoi les premiers savants s'accordaient-ils en principe concernant Adnan ?",
    o: [
      "Il était parmi les descendants d'Ismail fils d'Ibrahim",
      "Il était directement le fils d'Ismail",
      "Il était parmi les descendants d'Ishaq fils d'Ibrahim",
      "Il n'avait aucun lien avec Ibrahim",
    ],
    e: "Le texte indique que les premiers savants s'accordaient en principe sur le fait qu'Adnan est parmi les descendants d'Ismail, fils d'Ibrahim.",
  },
  {
    q: "Par quel fils d'Ismail les savants disaient-ils qu'Adnan était passé ?",
    o: ["Qaidar", "Ishaq", "Yaqub", "Luyy"],
    e: "Le texte indique spécifiquement qu'Adnan est de la progéniture de Qaidar, fils d'Ismail.",
  },
  {
    q: "Comment le texte décrit-il la liste des aïeux entre Adnan et Ismail ?",
    o: [
      "Elle n'était pas admise comme une liste unique précise et pleinement authentifiée",
      "Elle était pleinement admise par tous les premiers savants",
      "Elle était plus précise que la lignée jusqu'à Adnan",
      "Elle était entièrement rejetée par les savants",
    ],
    e: "Le texte indique que les premiers savants ne s'accordaient pas sur une liste unique précise et pleinement authentifiée de tous les aïeux entre Adnan et Ismail.",
  },
  {
    q: "Que dit le texte des chaînes depuis Ibrahim jusqu'à Adam ?",
    o: [
      "Elles n'ont pas le même degré de précision et d'accord que la lignée jusqu'à Adnan",
      "Elles sont la partie la plus précise de la lignée",
      "Elles étaient entièrement admises par tous les premiers savants",
      "Elles commencent par Adnan et se terminent par Ismail",
    ],
    e: "Le texte indique clairement que les chaînes depuis Ibrahim jusqu'à Adam n'ont pas la même précision et le même accord que la portion jusqu'à Adnan.",
  },
  {
    q: "Quel était le nom personnel d'Abdul-Muttalib selon le texte ?",
    o: ["Shaiba", "Amr", "Zaid", "Qais"],
    e: "Le texte indique : « Le nom d'Abdul-Muttalib était Shaiba. »",
  },
  {
    q: "Quel ancêtre était aussi appelé Amr ?",
    o: ["Hashim", "Qusai", "Mudrikah", "an-Nadr"],
    e: "Le texte indique : « Le nom de Hashim était Amr. »",
  },
  {
    q: "Qui était appelé al-Mugheera ?",
    o: ["Abd Manaf", "Fihr", "Kilab", "Ilyas"],
    e: "Le texte indique qu'Abd Manaf était appelé al-Mugheera.",
  },
  {
    q: "Quel ancêtre était aussi appelé Zaid ?",
    o: ["Qusai", "Hashim", "Murra", "Malik"],
    e: "Le texte indique : « Qusai était aussi appelé Zaid. »",
  },
  {
    q: "Selon le texte, Fihr était appelé sous quel nom ?",
    o: ["Quraysh", "Qais", "Amir", "Shaiba"],
    e: "Le texte indique explicitement : « Fihr était appelé Quraysh. »",
  },
  {
    q: "Pourquoi la tribu fut-elle nommée Quraysh selon le texte ?",
    o: [
      "Elle fut nommée d'après Fihr",
      "Elle fut nommée d'après Hashim",
      "Elle fut nommée d'après Adnan",
      "Elle fut nommée d'après Qaidar",
    ],
    e: "Le texte indique que Fihr était appelé Quraysh et que la tribu fut nommée d'après Fihr.",
  },
  {
    q: "Lequel des suivants complète correctement cette séquence : Muhammad bin Abdullah bin Abdul-Muttalib bin ___ ?",
    o: ["Hashim", "Abd Manaf", "Qusai", "Kilab"],
    e: "Le texte donne la lignée : Muhammad bin Abdullah, Abdullah bin Abdul-Muttalib, Abdul-Muttalib bin Hashim.",
  },
  {
    q: "Qui est nommé comme le père d'an-Nadr dans le texte ?",
    o: ["Kinanah", "Malik", "Fihr", "Khuzaimah"],
    e: "Le texte indique : « an-Nadr bin Kinanah. »",
  },
  {
    q: "Quel ancêtre était aussi appelé Amir ?",
    o: ["Mudrikah", "Ilyas", "Mudar", "Nizar"],
    e: "Le texte indique : « Mudrikah était appelé Amir. »",
  },
]);

fs.writeFileSync(
  path.join(__dirname, "_fr-qz-11.json"),
  JSON.stringify({ "11": out["11"] }, null, 2),
  "utf8"
);
console.log("Wrote part 11");
