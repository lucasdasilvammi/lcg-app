const quizData = require('../data/quiz.json');
const {
  getAvailableQuizCategories,
  getAvailableQuizDifficulties,
  takeQuizQuestion,
  takeRandomUnusedActivity,
  takeRandomUnusedQuestion
} = require('../contentSelection');

test('the two CSV exports provide 162 valid quiz questions across difficulties 1 to 5', () => {
  const questions = Object.values(quizData).filter(Array.isArray).flat();
  const ids = new Set(questions.map((question) => question.id));
  const difficulties = [...new Set(questions.map((question) => question.diff))].sort();

  expect(questions).toHaveLength(162);
  expect(ids.size).toBe(162);
  expect(difficulties).toEqual([1, 2, 3, 4, 5]);
  expect(questions.every((question) => (
    question.options.length === 3
    && question.options[question.correct]
    && question.category
  ))).toBe(true);
});

test('quiz selection keeps the requested category and difficulty without repeats or fallback', () => {
  const room = {};
  const questions = [
    { id: 'culture-3-a', q: 'A', category: 'Culture graphique', diff: 3 },
    { id: 'culture-3-b', q: 'B', category: 'Culture graphique', diff: 3 },
    { id: 'culture-4', q: 'C', category: 'Culture graphique', diff: 4 },
    { id: 'logo-3', q: 'D', category: 'Logo', diff: 3 }
  ];

  expect(takeQuizQuestion(room, questions, 'Culture graphique', 3, () => 0).id).toBe('culture-3-a');
  expect(takeQuizQuestion(room, questions, 'Culture graphique', 3, () => 0).id).toBe('culture-3-b');
  expect(takeQuizQuestion(room, questions, 'Culture graphique', 3, () => 0)).toBeNull();
  expect(getAvailableQuizDifficulties(room, questions, 'Culture graphique')).toEqual([4]);
  expect(getAvailableQuizCategories(room, questions)).toEqual(['Culture graphique', 'Logo']);
  expect(takeQuizQuestion(room, questions, 'Culture graphique', 4, () => 0).id).toBe('culture-4');
  expect(getAvailableQuizCategories(room, questions)).toEqual(['Logo']);
});

test('quiz category selection excludes recent categories when alternatives exist', () => {
  const room = {};
  const questions = [
    { id: 'culture-1', q: 'A', category: 'Culture graphique', diff: 1 },
    { id: 'logo-1', q: 'B', category: 'Logo', diff: 1 },
    { id: 'production-1', q: 'C', category: 'Production', diff: 1 },
    { id: 'typo-1', q: 'D', category: 'Typographie', diff: 1 }
  ];

  expect(getAvailableQuizCategories(room, questions, ['Logo', 'Production'])).toEqual([
    'Culture graphique',
    'Typographie'
  ]);
});

test('quiz category selection falls back if every available category is excluded', () => {
  const room = {};
  const questions = [
    { id: 'logo-1', q: 'A', category: 'Logo', diff: 1 },
    { id: 'production-1', q: 'B', category: 'Production', diff: 1 }
  ];

  expect(getAvailableQuizCategories(room, questions, ['Logo', 'Production'])).toEqual([
    'Logo',
    'Production'
  ]);
});

test('challenge questions are removed from the room pool after being seen', () => {
  const room = {};
  const challenges = [
    { type: 'buzzer', question: 'Question A' },
    { type: 'buzzer', question: 'Question B' },
    { type: 'zoom', question: 'Quel est ce logo ?', image: '/zoom/a.jpg' },
    { type: 'zoom', question: 'Quel est ce logo ?', image: '/zoom/b.jpg' }
  ];

  expect(takeRandomUnusedQuestion(room, challenges, () => 0).question).toBe('Question A');
  expect(takeRandomUnusedQuestion(room, challenges, () => 0).question).toBe('Question B');
  expect(takeRandomUnusedQuestion(room, challenges, () => 0).image).toBe('/zoom/a.jpg');
  expect(takeRandomUnusedQuestion(room, challenges, () => 0).image).toBe('/zoom/b.jpg');
  expect(takeRandomUnusedQuestion(room, challenges, () => 0)).toBeNull();
});

test('common activities are removed from the room pool after being played', () => {
  const room = {};
  const activities = ['BMW', 'Adobe'];

  expect(takeRandomUnusedActivity(room, activities, undefined, () => 0)).toBe('BMW');
  expect(takeRandomUnusedActivity(room, activities, undefined, () => 0)).toBe('Adobe');
  expect(takeRandomUnusedActivity(room, activities, undefined, () => 0)).toBeNull();
});
