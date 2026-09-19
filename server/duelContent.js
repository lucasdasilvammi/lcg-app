const fs = require('fs');
const path = require('path');
const duelsData = require('./data/duels.json');
const {
  getUnusedQuestions,
  markQuestionUsed,
  takeRandomUnusedQuestion
} = require('./contentSelection');
const { DUEL_REWARD_POINTS } = require('./duelReward');

const STATIC_DUEL_TYPES = Object.keys(duelsData).filter(key => !key.startsWith('_'));
const STATIC_DUELS_BY_TYPE = STATIC_DUEL_TYPES.reduce((accumulator, type) => {
  accumulator[type] = Array.isArray(duelsData[type]) ? duelsData[type] : [];
  return accumulator;
}, {});

const DUEL_TYPES = ['buzzer', 'vraioufaux', 'chiffres', 'zoom', 'pick'];
const ZOOM_ASSETS_DIR = path.join(__dirname, '..', 'client', 'public', 'defis', 'zoom');
const ZOOM_ASSET_ROUTE = '/defis/zoom';
const ZOOM_DISTRACTORS_FILE = path.join(__dirname, 'data', 'zoom-distractors.json');
const ZOOM_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

const shuffleArray = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

const normalizeZoomAnswer = (value) => String(value || '')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLocaleLowerCase('fr-FR');

const formatZoomAnswerFromFileName = (fileName) => {
  const rawName = path.parse(fileName).name
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!rawName) return null;
  if (/[A-ZÀ-Þ]/.test(rawName)) return rawName;

  return rawName
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getZoomManualDistractors = () => {
  try {
    const rawConfig = fs.readFileSync(ZOOM_DISTRACTORS_FILE, 'utf8');
    const config = JSON.parse(rawConfig);

    return Object.entries(config).reduce((accumulator, [answer, distractors]) => {
      if (answer.startsWith('_') || !Array.isArray(distractors)) return accumulator;

      const cleanDistractors = distractors
        .map(distractor => String(distractor || '').trim())
        .filter(Boolean);

      if (cleanDistractors.length > 0) {
        accumulator.set(normalizeZoomAnswer(answer), cleanDistractors);
      }

      return accumulator;
    }, new Map());
  } catch (error) {
    console.warn('Impossible de lire les mauvaises reponses Zoom personnalisees:', error.message);
    return new Map();
  }
};

const getZoomDistractors = (asset, allAnswers, manualDistractorsByAnswer) => {
  const usedAnswers = new Set([asset.normalizedAnswer]);
  const manualDistractors = manualDistractorsByAnswer.get(asset.normalizedAnswer) || [];
  const selectedDistractors = [];

  manualDistractors.forEach((distractor) => {
    const normalizedDistractor = normalizeZoomAnswer(distractor);
    if (!normalizedDistractor || usedAnswers.has(normalizedDistractor) || selectedDistractors.length >= 2) return;

    usedAnswers.add(normalizedDistractor);
    selectedDistractors.push(distractor);
  });

  if (selectedDistractors.length >= 2) return selectedDistractors;

  const fallbackDistractors = shuffleArray(allAnswers)
    .filter((answer) => {
      const normalizedAnswer = normalizeZoomAnswer(answer);
      if (!normalizedAnswer || usedAnswers.has(normalizedAnswer)) return false;
      usedAnswers.add(normalizedAnswer);
      return true;
    });

  return [...selectedDistractors, ...fallbackDistractors].slice(0, 2);
};

const getZoomDuelsFromAssets = () => {
  let directoryEntries = [];

  try {
    directoryEntries = fs.readdirSync(ZOOM_ASSETS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const assets = directoryEntries
    .filter((entry) => entry.isFile() && ZOOM_IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => {
      const answer = formatZoomAnswerFromFileName(entry.name);
      if (!answer) return null;

      return {
        fileName: entry.name,
        answer,
        normalizedAnswer: normalizeZoomAnswer(answer)
      };
    })
    .filter(Boolean);

  const uniqueAssets = Array.from(
    assets.reduce((accumulator, asset) => {
      if (!accumulator.has(asset.normalizedAnswer)) {
        accumulator.set(asset.normalizedAnswer, asset);
      }
      return accumulator;
    }, new Map()).values()
  );

  const allAnswers = uniqueAssets.map(asset => asset.answer);
  const manualDistractorsByAnswer = getZoomManualDistractors();

  return uniqueAssets.map((asset) => {
    const distractors = getZoomDistractors(asset, allAnswers, manualDistractorsByAnswer);
    const options = shuffleArray([asset.answer, ...distractors]);

    return {
      type: 'zoom',
      question: 'Quel est ce logo ?',
      image: `${ZOOM_ASSET_ROUTE}/${encodeURIComponent(asset.fileName)}`,
      answer: asset.answer,
      options,
      correct: options.indexOf(asset.answer),
      explanation: `Logo ${asset.answer} issu du dossier defis/zoom.`
    };
  });
};

const getDuelsByType = (type) => {
  if (type === 'zoom') {
    const zoomDuels = getZoomDuelsFromAssets();
    if (zoomDuels.length > 0) return zoomDuels;
  }

  return STATIC_DUELS_BY_TYPE[type] || [];
};

const getAllDuels = () => STATIC_DUEL_TYPES.flatMap(type => getDuelsByType(type));

const getRandomHexColor = () => {
  const value = Math.floor(Math.random() * 0xFFFFFF);
  return `#${value.toString(16).padStart(6, '0')}`.toUpperCase();
};

const getAvailableDuelTypes = (room) => DUEL_TYPES.filter(type => {
  if (type === 'pick') return true;
  return getUnusedQuestions(room, getDuelsByType(type)).length > 0;
});

const createPickDuel = (room) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const targetColor = getRandomHexColor();
    const duel = {
      type: 'pick',
      contentId: `pick:${targetColor}`,
      question: 'Pick la couleur cible',
      targetColor,
      explanation: 'Trouve la couleur la plus proche possible.'
    };
    if (getUnusedQuestions(room, [duel]).length === 0) continue;
    markQuestionUsed(room, duel);
    return duel;
  }

  return null;
};

const getRoomDuelTypeBag = (room) => {
  if (!room) return [];
  if (!Object.prototype.hasOwnProperty.call(room, '_duelTypeBag')) {
    Object.defineProperty(room, '_duelTypeBag', {
      value: [],
      writable: true,
      enumerable: false
    });
  }
  return room._duelTypeBag;
};

const getNextDuelTypeForRoom = (room) => {
  const availableTypes = getAvailableDuelTypes(room);
  if (availableTypes.length === 0) return null;

  const bag = getRoomDuelTypeBag(room);
  const remainingAvailableTypes = bag.filter(type => availableTypes.includes(type));

  if (remainingAvailableTypes.length === 0) {
    room._duelTypeBag = [...availableTypes];
  } else {
    room._duelTypeBag = remainingAvailableTypes;
  }

  const nextIndex = Math.floor(Math.random() * room._duelTypeBag.length);
  const [nextType] = room._duelTypeBag.splice(nextIndex, 1);
  return nextType;
};

const getRandomDuel = (room, type = null, { fallback = true } = {}) => {
  const selectedType = type || getRandomItem(getAvailableDuelTypes(room));
  if (!selectedType) return takeRandomUnusedQuestion(room, getAllDuels());

  if (selectedType === 'pick') return createPickDuel(room);

  const filtered = getDuelsByType(selectedType);
  const selectedDuel = takeRandomUnusedQuestion(room, filtered);
  if (selectedDuel) return selectedDuel;

  return type && fallback ? getRandomDuel(room) : null;
};

const createRandomDuelInteraction = (room, initiatingPlayerId = null, forcedDuelType = null) => {
  const activePlayer = room.players.find(player => player.id === initiatingPlayerId) || room.players[room.turnIndex];
  if (!activePlayer) return null;

  const opponentCandidates = room.players.filter(player => player.id !== activePlayer.id);
  if (opponentCandidates.length === 0) return null;

  const selectedDuelType = forcedDuelType || getNextDuelTypeForRoom(room);
  const randomDuel = getRandomDuel(room, selectedDuelType, { fallback: !forcedDuelType });
  if (!randomDuel) return null;
  const opponent = getRandomItem(opponentCandidates);
  const readerCandidates = room.players.filter(player => player.id !== activePlayer.id && player.id !== opponent.id);
  const reader = readerCandidates.length > 0 ? getRandomItem(readerCandidates) : activePlayer;
  const isZoomDuel = randomDuel.type === 'zoom';

  return {
    type: randomDuel.type,
    data: randomDuel,
    duelists: [activePlayer.id, opponent.id],
    readerId: reader.id,
    buzzedPlayerId: null,
    potentialPoints: DUEL_REWARD_POINTS,
    acknowledgedRules: [],
    ...(isZoomDuel
      ? {
          zoomStartAt: null,
          zoomDurationMs: 30000,
          zoomScaleStart: 10,
          zoomScaleEnd: 1,
          blockedUntil: {},
          pausedDurationMs: 0,
          pauseStartedAt: null,
          zoomResolvedCorrect: false,
          zoomFastRevealStartAt: null,
          zoomFastRevealDurationMs: 1200
        }
      : {})
  };
};

module.exports = {
  DUEL_TYPES,
  ZOOM_ASSETS_DIR,
  ZOOM_ASSET_ROUTE,
  createRandomDuelInteraction,
  formatZoomAnswerFromFileName,
  getDuelsByType,
  getZoomDuelsFromAssets,
  normalizeZoomAnswer
};
