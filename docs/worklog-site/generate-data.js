const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SITE_DIR = __dirname;
const ROOT_DIR = path.resolve(SITE_DIR, "..", "..");
const WORKLOG_PATH = path.join(ROOT_DIR, "docs", "deployment", "WORKLOG.md");
const TODO_PATH = path.join(ROOT_DIR, "TODO.md");
const OUTPUT_PATH = path.join(SITE_DIR, "worklog-data.js");

const WORKLOG_SOURCE = "WORKLOG.md";
const TODO_SOURCE = "TODO.md";
const FRENCH_MONTHS = {
  janvier: "01",
  fevrier: "02",
  mars: "03",
  avril: "04",
  mai: "05",
  juin: "06",
  juillet: "07",
  aout: "08",
  septembre: "09",
  octobre: "10",
  novembre: "11",
  decembre: "12"
};

function readLines(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
}

function cleanMarkdown(value) {
  return String(value || "")
    .replace(/^\s*[-*]\s+/, "")
    .replace(/^\s*\d+\.\s+/, "")
    .replace(/^#+\s+/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return cleanMarkdown(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseFrenchDateKey(value) {
  const text = normalizeText(value);
  const match = text.match(/\b(\d{1,2})\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{4})\b/);
  if (!match) return "0000-00-00";

  const day = match[1].padStart(2, "0");
  const month = FRENCH_MONTHS[match[2]] || "00";
  const year = match[3];
  return `${year}-${month}-${day}`;
}

function truncate(value, maxLength = 170) {
  const text = cleanMarkdown(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function buildTodoCardTitle(value) {
  const text = cleanMarkdown(value);
  const normalized = normalizeText(text);

  if (/premier bonus obtenu/.test(normalized)) return "Onboarding bonus";
  if (/tester les bonus avec 3 joueurs puis avec 4 joueurs/.test(normalized)) return "Bonus 3 et 4 joueurs";
  if (/collisions entre bonus :/.test(normalized)) return "Collisions bonus globales";
  if (/session test complete a 3 joueurs/.test(normalized)) return "Session test 3 joueurs";
  if (/session test complete a 4 joueurs/.test(normalized)) return "Session test 4 joueurs";
  if (/test manuel mobile/.test(normalized)) return "Test mobile reel";
  if (/reconnexion/.test(normalized) && /bonus/.test(normalized)) return "Bonus + reconnexion";
  if (/changement d'ordre/.test(normalized) && /bonus/.test(normalized)) return "Bonus + ordre du tour";
  if (/changement de round/.test(normalized) && /bonus/.test(normalized)) return "Bonus + nouveau round";
  if (/annulation d'action/.test(normalized) && /bonus/.test(normalized)) return "Bonus + annulation";
  if (/collisions entre bonus/.test(normalized)) return "Collisions bonus";
  if (/cible est le joueur actif/.test(normalized)) return "Coffee boss sur joueur actif";
  if (/cible joue plus tard/.test(normalized)) return "Coffee boss plus tard";
  if (/annulation d'action/.test(normalized) && /changement de round/.test(normalized)) return "Coffee boss annulation + round";
  if (/reconnect/.test(normalized) && /tour saute/.test(normalized)) return "Coffee boss reconnexion";
  if (/joueur cible ne peut pas lancer le de/.test(normalized)) return "Coffee boss bloque le de";
  if (/tour saute/.test(normalized) && /de/.test(normalized)) return "Coffee boss bloque le de";
  if (/sabotage quizz deja en attente/.test(normalized)) return "Sabotage quiz deja pose";
  if (/recevoir ce bonus deux fois/.test(normalized)) return "Double sabotage quiz";
  if (/question finale/.test(normalized) && /difficulte/.test(normalized)) return "Difficulte choisie appliquee";
  if (/joueur qui a pose le bonus/.test(normalized)) return "Poseur choisit seul";
  if (/theme du quiz/.test(normalized)) return "Theme quiz aleatoire";
  if (/spectateurs/.test(normalized) && /choisit/.test(normalized)) return "Vue spectateurs sabotage";
  if (/cible voit d'abord/.test(normalized)) return "Explication cible sabotage";
  if (/fullscreen/.test(normalized)) return "Fullscreen double tap";
  if (/livret de regles/.test(normalized)) return "Livret de regles";
  if (/nouveaux logos/.test(normalized)) return "Nouveaux logos Zoom";
  if (/nouveaux evenements/.test(normalized)) return "Futurs events deplacement";
  if (/onboarding global/.test(normalized)) return "Onboarding global V2";

  const shortened = text
    .replace(/^(Tester|Vérifier|Verifier|Corriger|Ajouter|Faire|Étendre|Etendre|Importer|Imprimer)\s+/i, "")
    .replace(/^(que|qu'|les?|un|une|des)\s+/i, "")
    .replace(/collisions entre bonus et/gi, "Bonus +")
    .replace(/collisions entre bonus/gi, "Collisions bonus")
    .trim();

  return truncate(shortened, 54);
}

function slugify(value, fallback) {
  const slug = cleanMarkdown(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return slug || fallback;
}

function shortHash(value) {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex").slice(0, 12);
}

function extractFiles(...parts) {
  const text = parts.join(" ");
  const files = new Set();
  const codeMatches = text.matchAll(/`([^`]+)`/g);

  for (const match of codeMatches) {
    const candidate = match[1].trim();
    if (isFileLike(candidate)) files.add(candidate);
  }

  const pathMatches = text.matchAll(/\b(?:client|server|docs|scripts|build|public|src|data)\/[A-Za-z0-9_.\-/' ]+\b/g);
  for (const match of pathMatches) {
    const candidate = match[0].replace(/[.,;:)]+$/g, "").trim();
    if (isFileLike(candidate)) files.add(candidate);
  }

  return Array.from(files).slice(0, 8);
}

function isFileLike(value) {
  return /[/.]/.test(value)
    && !/^https?:\/\//.test(value)
    && !/^\{.*\}$/.test(value)
    && value.length < 120;
}

function inferCategory(...parts) {
  const text = cleanMarkdown(parts.join(" ")).toLowerCase();

  if (/(test|qa|validation|checklist|pretest|release|v1|verifier|vérifier|retester|tester)/i.test(text)) return "Tests";
  if (/(doc|documentation|worklog|readme|todo|notes|architecture|maintenance|regles|règles|prochaines|a suivre|à suivre)/i.test(text)) return "Documentation";
  if (/(question|contenu|assets|asset|logo|quiz\.json|duels\.json|redaction|rédaction|donnees|données|texte|accent)/i.test(text)) return "Contenu";
  if (/(ui|ux|design|popup|mobile|responsive|menu|ecran|écran|vue|bouton|animation|fullscreen|selectcharacter|lobby|onboarding|classement)/i.test(text)) return "Interface";
  if (/(serveur|server|reconnexion|session|room|socket|code|build|npm|debug|token|stockage|base64|generateur|générateur|technique|lint)/i.test(text)) return "Technique";

  return "Gameplay";
}

function inferDoneStatus(title, details) {
  const text = cleanMarkdown([title, ...details].join(" ")).toLowerCase();

  if (/(a reprendre|à reprendre|prochaine|en cours|debugging|reste|a suivre|à suivre)/i.test(text)) return "A suivre";
  if (/(test|validation|checklist|verif|vérif|retest|qa)/i.test(text)) return "Teste";
  if (/(bug|debug|correction|corrige|corrigé|repare|réparé|fix)/i.test(text)) return "Corrige";
  if (/(ajout|creation|création|implemente|implémenté|branche|branché|integre|intégré)/i.test(text)) return "Implemente";
  if (/(refonte|refactor|redesign|polish)/i.test(text)) return "Refondu";

  return "Fait";
}

function inferTodoStatus(task, done) {
  const text = normalizeText(task);
  if (done) return "Valide";
  if (/^(plus tard|v2)\b/i.test(text) || /hors perimetre/i.test(text)) return "Plus tard";
  if (/(test|tester|verifier|retester|relancer|session)/i.test(text)) return "A tester";
  return "En attente";
}

function inferPendingScope(task, sectionPath, status) {
  const text = normalizeText(`${sectionPath} ${task}`);
  if (status === "Plus tard") return "later";
  if (/(^|\s)(v2|hors perimetre|idee|idees|futur|future)(\s|$)/i.test(text)) return "later";
  return "v1";
}

function getScopeLabel(scope) {
  return scope === "later" ? "Plus tard" : "V1";
}

function buildWorklogDoneItems() {
  const lines = readLines(WORKLOG_PATH);
  const items = [];
  let dateTitle = "Worklog";
  let parentTitle = "";
  let active = null;

  function finalizeActive() {
    if (!active) return;

    const details = active.lines
      .map(cleanMarkdown)
      .filter(Boolean)
      .filter((line) => line !== "---")
      .slice(0, 12);
    const detailText = details.join(" ");
    const title = cleanMarkdown(active.title);
    const category = inferCategory(title, active.parentTitle, detailText, active.date);

    const dateKey = parseFrenchDateKey(active.date);
    items.push({
      id: `done-${slugify(active.date, "date")}-${slugify(active.parentTitle || title, "section")}-${slugify(title, `item-${items.length}`)}-${items.length + 1}`,
      type: "done",
      source: WORKLOG_SOURCE,
      sourceType: "worklog",
      sourceKind: active.level === 4 ? "Sous-section worklog" : "Section worklog",
      sourceOrder: items.length,
      sortKey: dateKey,
      timePrecision: "date",
      title,
      date: cleanMarkdown(active.date),
      time: "",
      category,
      status: inferDoneStatus(title, details),
      impact: active.parentTitle ? cleanMarkdown(active.parentTitle) : "Worklog",
      summary: truncate(details[0] || `Entree du worklog rattachee a ${cleanMarkdown(active.date)}.`),
      details: details.length > 0 ? details : [`Section ${active.level === 4 ? "detaillee" : "principale"} du worklog.`],
      files: extractFiles(title, detailText)
    });

    active = null;
  }

  for (const line of lines) {
    const heading = line.match(/^(#{2,4})\s+(.+?)\s*$/);

    if (heading) {
      const level = heading[1].length;
      const title = heading[2].trim();

      if (level === 2) {
        finalizeActive();
        dateTitle = title;
        parentTitle = "";
        continue;
      }

      if (level === 3 || level === 4) {
        finalizeActive();
        if (level === 3) parentTitle = title;
        active = {
          level,
          title,
          date: dateTitle,
          parentTitle: level === 4 ? parentTitle : "",
          lines: []
        };
        continue;
      }
    }

    if (active && line.trim()) active.lines.push(line);
  }

  finalizeActive();
  return items;
}

function buildTodoItems() {
  const lines = readLines(TODO_PATH);
  const doneItems = [];
  const pendingItems = [];
  const sectionStack = [];

  function setSection(level, title) {
    const index = level - 2;
    sectionStack[index] = cleanMarkdown(title);
    sectionStack.length = index + 1;
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const heading = line.match(/^(#{2,4})\s+(.+?)\s*$/);
    if (heading) {
      setSection(heading[1].length, heading[2]);
      continue;
    }

    const task = line.match(/^\s*-\s+\[(x|X| )\]\s+(.+?)\s*$/);
    if (!task) continue;

    const done = task[1].toLowerCase() === "x";
    const fullTitle = cleanMarkdown(task[2]);
    const title = buildTodoCardTitle(fullTitle);
    const sectionPath = sectionStack.filter(Boolean).join(" / ") || "TODO";
    const category = inferCategory(fullTitle, sectionPath);
    const status = inferTodoStatus(fullTitle, done);
    const scope = done ? "done" : inferPendingScope(fullTitle, sectionPath, status);
    const normalizedTask = normalizeText(`${sectionPath} ${fullTitle}`);
    const isBonusRelated = /(bonus|ctrl \+ z|coffee|cafe|choisis|sabotage)/i.test(normalizedTask);
    const isBroadBonusTodo = /(onboarding|3 joueurs|4 joueurs)/i.test(normalizedTask);
    const isBonusHumanCheck = !done && scope === "v1" && isBonusRelated && !isBroadBonusTodo;
    const stableId = `todo-${slugify(sectionPath, "todo")}-${slugify(fullTitle, "task")}-${shortHash(`${sectionPath}\n${fullTitle}`)}`;
    const legacyId = `${done ? "todo-done" : "todo-pending"}-${slugify(sectionPath, "todo")}-${slugify(title, "task")}-${done ? doneItems.length + 1 : pendingItems.length + 1}`;
    const item = {
      id: stableId,
      legacyIds: [legacyId],
      type: done ? "done" : "pending",
      source: TODO_SOURCE,
      sourceType: "todo",
      sourceKind: done ? "Checklist validee" : "Checklist en attente",
      sourceOrder: done ? 10000 + doneItems.length : 20000 + pendingItems.length,
      sortKey: "0000-00-00",
      timePrecision: "none",
      title,
      date: done ? "TODO valide" : "TODO en attente",
      time: "",
      category,
      status: isBonusHumanCheck ? "A verifier humainement" : status,
      scope,
      scopeLabel: done ? "Fait" : getScopeLabel(scope),
      impact: sectionPath,
      fullTitle,
      todoReference: {
        file: TODO_SOURCE,
        line: lineIndex + 1,
        section: sectionPath,
        taskText: fullTitle,
        markdown: line.trim()
      },
      summary: truncate(fullTitle),
      aiValidated: isBonusHumanCheck,
      aiNote: isBonusHumanCheck
        ? "IA/test auto OK sur les scenarios bonus critiques deja corriges. Cette carte garde la verification humaine ou un cas long a rejouer."
        : "",
      humanReview: isBonusHumanCheck,
      reviewNote: isBonusHumanCheck
        ? "A verifier en vraie partie pour confirmer le ressenti joueur, les messages et les cas longs non couverts par les tests automatiques."
        : "",
      details: [
        `Section: ${sectionPath}`,
        `Tache complete: ${fullTitle}`,
        done ? "Element deja coche dans la TODO." : "Element non coche dans la TODO.",
        isBonusHumanCheck ? "Nuance bonus: pour l'IA, les scenarios critiques testes sont valides; cette carte reste une verification humaine ou un cas complementaire." : "",
        !done ? `Priorite automatique: ${getScopeLabel(scope)}.` : "",
        status === "Plus tard" ? "Marque comme plus tard ou hors perimetre immediat." : ""
      ].filter(Boolean),
      files: extractFiles(fullTitle, sectionPath)
    };

    if (done) doneItems.push(item);
    else pendingItems.push(item);
  }

  return { doneItems, pendingItems };
}

const worklogDoneItems = buildWorklogDoneItems();
const todo = buildTodoItems();
const doneItems = [...worklogDoneItems, ...todo.doneItems];
const pendingItems = todo.pendingItems;
const pendingV1Items = pendingItems.filter((item) => item.scope === "v1");
const pendingLaterItems = pendingItems.filter((item) => item.scope === "later");

const metadata = {
  generatedAt: new Date().toISOString(),
  sources: [WORKLOG_SOURCE, TODO_SOURCE],
  counts: {
    done: doneItems.length,
    pending: pendingItems.length,
    pendingV1: pendingV1Items.length,
    pendingLater: pendingLaterItems.length,
    worklogSections: worklogDoneItems.length,
    todoDone: todo.doneItems.length,
    todoPending: todo.pendingItems.length
  }
};

const output = `// Generated by docs/worklog-site/generate-data.js. Do not edit manually.\n`
  + `window.WORKLOG_DONE_ITEMS = ${JSON.stringify(doneItems, null, 2)};\n`
  + `window.WORKLOG_PENDING_ITEMS = ${JSON.stringify(pendingItems, null, 2)};\n`
  + `window.WORKLOG_ITEMS = window.WORKLOG_DONE_ITEMS;\n`
  + `window.TODO_ITEMS = window.WORKLOG_PENDING_ITEMS;\n`
  + `window.WORKLOG_META = ${JSON.stringify(metadata, null, 2)};\n`;

fs.writeFileSync(OUTPUT_PATH, output, "utf8");
console.log(JSON.stringify(metadata, null, 2));
