const storage = require('../../utils/storage');
const helpers = require('./helpers');
const studyStorage = require('./storage');
const deadlineTimer = require('../../utils/deadline-timer');

const SESSION_KEY = 'spring_review_active_session_v1';
const EXAM_SETTINGS_KEY = 'spring_review_exam_settings_v1';
const DEFAULT_EXAM_QUESTION_COUNT = 50;
const DEFAULT_EXAM_DURATION_MINUTES = 60;

function normalizeExamSettings(input) {
  input = input || {};
  var examTimeRemaining = helpers.clampNumber(
    typeof value.examTimeRemaining === 'number'
      ? value.examTimeRemaining
      : DEFAULT_EXAM_DURATION_MINUTES * 60,
    0,
    24 * 60 * 60,
  );
  var savedAt = typeof value.savedAt === 'number' ? value.savedAt : Date.now();
  var examDeadline =
    typeof value.examDeadline === 'number' && Number.isFinite(value.examDeadline)
      ? value.examDeadline
      : savedAt + examTimeRemaining * 1000;

  return {
    questionCount: helpers.clampNumber(
      input.questionCount != null ? input.questionCount : DEFAULT_EXAM_QUESTION_COUNT,
      1,
      999,
    ),
    durationMinutes: helpers.clampNumber(
      input.durationMinutes != null ? input.durationMinutes : DEFAULT_EXAM_DURATION_MINUTES,
      5,
      240,
    ),
  };
}

function readJSON(key, fallback) {
  var value = storage.getJSON(key, null);
  if (value !== null && value !== undefined) return value;
  try {
    var raw = wx.getStorageSync(key);
    if (raw === '' || raw === undefined || raw === null) return fallback;
    if (typeof raw === 'object') return raw;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function getExamSettings() {
  return normalizeExamSettings(readJSON(EXAM_SETTINGS_KEY, normalizeExamSettings()));
}

function saveExamSettings(settings) {
  var next = normalizeExamSettings(settings);
  storage.setJSON(EXAM_SETTINGS_KEY, next);
  return next;
}

function normalizeActiveStudySession(value, decks) {
  if (!value || typeof value !== 'object') return null;
  var mode = value.mode;
  if (mode !== 'reccite' && mode !== 'practice' && mode !== 'exam') return null;
  if (!Array.isArray(value.questions) || value.questions.length === 0) return null;

  var deckId = typeof value.deckId === 'string' ? value.deckId : null;
  var deckList = decks || studyStorage.getDecks();
  if (
    deckId &&
    !deckList.some(function (deck) {
      return deck.id === deckId;
    })
  ) {
    // Allow restudy from incorrect/favorites without a deck.
    if (deckId.indexOf('restudy-') !== 0 && deckId !== 'incorrect' && deckId !== 'favorites') {
      return null;
    }
  }

  var questions = value.questions
    .map(function (item, index) {
      return helpers.normalizeQuestion(item, helpers.toText(item && item.id, 'resume-q-' + index));
    })
    .filter(helpers.isValidQuestion);
  if (questions.length === 0) return null;

  var examAnswers = {};
  if (value.examAnswers && typeof value.examAnswers === 'object') {
    Object.keys(value.examAnswers).forEach(function (key) {
      if (typeof value.examAnswers[key] === 'string') {
        examAnswers[key] = value.examAnswers[key];
      }
    });
  }

  return {
    deckId: deckId,
    deckName: helpers.toText(value.deckName, ''),
    mode: mode,
    questions: questions,
    currentQuestionIdx: helpers.clampNumber(
      typeof value.currentQuestionIdx === 'number' ? value.currentQuestionIdx : 0,
      0,
      questions.length - 1,
    ),
    showExplanation: Boolean(value.showExplanation),
    selectedOption: typeof value.selectedOption === 'string' ? value.selectedOption : null,
    hasCheckedAnswer: Boolean(value.hasCheckedAnswer),
    isCorrect: typeof value.isCorrect === 'boolean' ? value.isCorrect : null,
    correctCountInSession: helpers.clampNumber(
      typeof value.correctCountInSession === 'number' ? value.correctCountInSession : 0,
      0,
      questions.length,
    ),
    practiceStartedAt:
      typeof value.practiceStartedAt === 'number' ? value.practiceStartedAt : Date.now(),
    examDurationSeconds: helpers.clampNumber(
      typeof value.examDurationSeconds === 'number'
        ? value.examDurationSeconds
        : DEFAULT_EXAM_DURATION_MINUTES * 60,
      60,
      24 * 60 * 60,
    ),
    examTimeRemaining: examTimeRemaining,
    examDeadline: examDeadline,
    examAnswers: examAnswers,
    savedAt: savedAt,
  };
}

function loadActiveSession() {
  return normalizeActiveStudySession(readJSON(SESSION_KEY, null), studyStorage.getDecks());
}

function saveActiveSession(session) {
  if (!session) {
    clearActiveSession();
    return null;
  }
  var normalized = normalizeActiveStudySession(
    Object.assign({}, session, { savedAt: Date.now() }),
    studyStorage.getDecks(),
  );
  if (!normalized) {
    clearActiveSession();
    return null;
  }
  storage.setJSON(SESSION_KEY, normalized);
  return normalized;
}

function clearActiveSession() {
  storage.remove(SESSION_KEY);
}

function createSession(options) {
  options = options || {};
  var mode = options.mode || 'practice';
  var questions = (options.questions || [])
    .map(function (q, index) {
      return helpers.normalizeQuestion(q, helpers.toText(q && q.id, 'sess-q-' + index));
    })
    .filter(helpers.isValidQuestion);
  if (questions.length === 0) return null;

  var examSettings = normalizeExamSettings(options.examSettings || getExamSettings());
  if (mode === 'exam') {
    questions = helpers.sampleQuestions(questions, examSettings.questionCount);
  }

  var durationSeconds = examSettings.durationMinutes * 60;
  var session = {
    deckId: options.deckId || null,
    deckName: options.deckName || '',
    mode: mode,
    questions: questions,
    currentQuestionIdx: 0,
    showExplanation: mode === 'reccite',
    selectedOption: null,
    hasCheckedAnswer: mode === 'reccite',
    isCorrect: mode === 'reccite' ? true : null,
    correctCountInSession: 0,
    practiceStartedAt: Date.now(),
    examDurationSeconds: durationSeconds,
    examTimeRemaining: durationSeconds,
    examDeadline: mode === 'exam' ? deadlineTimer.createDeadline(durationSeconds) : null,
    examAnswers: {},
    savedAt: Date.now(),
  };
  return saveActiveSession(session);
}

module.exports = {
  SESSION_KEY,
  EXAM_SETTINGS_KEY,
  DEFAULT_EXAM_QUESTION_COUNT,
  DEFAULT_EXAM_DURATION_MINUTES,
  normalizeExamSettings,
  getExamSettings,
  saveExamSettings,
  normalizeActiveStudySession,
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  createSession,
};
