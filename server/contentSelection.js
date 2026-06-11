const normalizeContentKey = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLocaleLowerCase('fr-FR');

const getQuestionKey = (item) => {
  if (!item) return '';
  if (item.contentId || item.id) return `id:${item.contentId || item.id}`;

  const primaryValue = item.q || item.image || item.question || item.answer || item.targetColor;
  return [
    item.type || 'question',
    normalizeContentKey(primaryValue)
  ].join(':');
};

const getRoomContentState = (room) => {
  if (!room) return null;

  if (!Object.prototype.hasOwnProperty.call(room, '_contentSelectionState')) {
    Object.defineProperty(room, '_contentSelectionState', {
      value: {
        usedQuestionKeys: new Set(),
        usedActivityKeys: new Set()
      },
      writable: true,
      enumerable: false
    });
  }

  return room._contentSelectionState;
};

const getUnusedQuestions = (room, questions) => {
  const state = getRoomContentState(room);
  if (!state || !Array.isArray(questions)) return [];

  return questions.filter((question) => {
    const key = getQuestionKey(question);
    return key && !state.usedQuestionKeys.has(key);
  });
};

const markQuestionUsed = (room, question) => {
  const state = getRoomContentState(room);
  const key = getQuestionKey(question);
  if (!state || !key) return false;

  state.usedQuestionKeys.add(key);
  return true;
};

const takeRandomUnusedQuestion = (room, questions, random = Math.random) => {
  const available = getUnusedQuestions(room, questions);
  if (available.length === 0) return null;

  const selected = available[Math.floor(random() * available.length)];
  markQuestionUsed(room, selected);
  return selected;
};

const getAvailableQuizDifficulties = (room, quizQuestions, category) => {
  const available = getUnusedQuestions(
    room,
    quizQuestions.filter((question) => question.category === category)
  );

  return [...new Set(available.map((question) => Number(question.diff)))]
    .filter((difficulty) => Number.isInteger(difficulty))
    .sort((left, right) => left - right);
};

const getAvailableQuizCategories = (room, quizQuestions) => {
  const available = getUnusedQuestions(room, quizQuestions);
  return [...new Set(available.map((question) => question.category).filter(Boolean))];
};

const takeQuizQuestion = (room, quizQuestions, category, difficulty, random = Math.random) => (
  takeRandomUnusedQuestion(
    room,
    quizQuestions.filter((question) => (
      question.category === category && Number(question.diff) === Number(difficulty)
    )),
    random
  )
);

const getUnusedActivities = (room, activities, getKey = (activity) => activity) => {
  const state = getRoomContentState(room);
  if (!state || !Array.isArray(activities)) return [];

  return activities.filter((activity) => {
    const key = normalizeContentKey(getKey(activity));
    return key && !state.usedActivityKeys.has(key);
  });
};

const takeRandomUnusedActivity = (
  room,
  activities,
  getKey = (activity) => activity,
  random = Math.random
) => {
  const state = getRoomContentState(room);
  const available = getUnusedActivities(room, activities, getKey);
  if (!state || available.length === 0) return null;

  const selected = available[Math.floor(random() * available.length)];
  state.usedActivityKeys.add(normalizeContentKey(getKey(selected)));
  return selected;
};

module.exports = {
  getAvailableQuizCategories,
  getAvailableQuizDifficulties,
  getQuestionKey,
  getUnusedActivities,
  getUnusedQuestions,
  markQuestionUsed,
  takeQuizQuestion,
  takeRandomUnusedActivity,
  takeRandomUnusedQuestion
};
