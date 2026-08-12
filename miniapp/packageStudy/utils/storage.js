const storage = require('../../utils/storage');
const helpers = require('./helpers');

const DECKS_KEY = 'study_xiaozhu_decks_v3';
const INCORRECT_KEY = 'spring_review_incorrect';
const FAVORITES_KEY = 'spring_review_favorites';
const STATS_KEY = 'spring_review_stats';
const LEGACY_DEMO_DECK_IDS = { 'deck-eng': true, 'deck-phy': true };

function readJSON(key, fallback) {
  var value = storage.getJSON(key, null);
  if (value !== null && value !== undefined) return value;
  // Fallback to untitled raw keys (no spring_nest: prefix)
  try {
    var raw = wx.getStorageSync(key);
    if (raw === '' || raw === undefined || raw === null) return fallback;
    if (typeof raw === 'object') return raw;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function isLegacyDemoDeck(deck) {
  return !!(deck && LEGACY_DEMO_DECK_IDS[deck.id]);
}

function normalizeDeck(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var questions = Array.isArray(raw.questions)
    ? raw.questions
        .map(function (q, index) {
          return helpers.normalizeQuestion(q, helpers.toText(q && q.id, 'q-' + index));
        })
        .filter(helpers.isValidQuestion)
    : [];
  return {
    id: helpers.toText(raw.id, helpers.uid('deck')),
    name: helpers.toText(raw.name, '未命名题集'),
    desc: helpers.toText(raw.desc, ''),
    emoji: helpers.toText(raw.emoji, '📚'),
    color: helpers.toText(raw.color, '#2D6A4F'),
    questions: questions,
    createdAt: raw.createdAt || Date.now(),
    lastReviewed: raw.lastReviewed || undefined,
    displayCount: raw.displayCount,
  };
}

function getDecks() {
  var raw = readJSON(DECKS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeDeck)
    .filter(Boolean)
    .filter(function (deck) {
      return !isLegacyDemoDeck(deck);
    });
}

function saveDecks(decks) {
  storage.setJSON(DECKS_KEY, decks || []);
}

function getDeckById(deckId) {
  return (
    getDecks().find(function (deck) {
      return deck.id === deckId;
    }) || null
  );
}

function upsertDeck(deck) {
  var normalized = normalizeDeck(deck);
  if (!normalized) return null;
  var decks = getDecks();
  var index = decks.findIndex(function (item) {
    return item.id === normalized.id;
  });
  if (index >= 0) {
    decks[index] = normalized;
  } else {
    decks.push(normalized);
  }
  saveDecks(decks);
  return normalized;
}

function addDeck(deck) {
  var normalized = normalizeDeck(deck);
  if (!normalized) return null;
  var decks = getDecks();
  decks.push(normalized);
  saveDecks(decks);
  return normalized;
}

function deleteDeck(deckId) {
  var decks = getDecks().filter(function (deck) {
    return deck.id !== deckId;
  });
  saveDecks(decks);
  return decks;
}

function updateDeckQuestions(deckId, updater) {
  var decks = getDecks();
  var changed = false;
  decks = decks.map(function (deck) {
    if (deck.id !== deckId) return deck;
    changed = true;
    var nextQuestions = typeof updater === 'function' ? updater(deck.questions.slice()) : updater;
    return Object.assign({}, deck, {
      questions: nextQuestions,
      lastReviewed: helpers.getDisplayReviewDate(),
    });
  });
  if (changed) saveDecks(decks);
  return decks;
}

function markQuestionsMastered(questionIds, mastered) {
  var idSet = {};
  (questionIds || []).forEach(function (id) {
    if (id) idSet[id] = true;
  });
  if (Object.keys(idSet).length === 0) return;
  var decks = getDecks().map(function (deck) {
    var changed = false;
    var questions = deck.questions.map(function (q) {
      if (!idSet[q.id]) return q;
      changed = true;
      return Object.assign({}, q, { mastered: !!mastered });
    });
    return changed
      ? Object.assign({}, deck, {
          questions: questions,
          lastReviewed: helpers.getDisplayReviewDate(),
        })
      : deck;
  });
  saveDecks(decks);

  var favorites = getFavorites().map(function (q) {
    if (!idSet[q.id]) return q;
    return Object.assign({}, q, { mastered: !!mastered });
  });
  saveFavorites(favorites);
}

function getIncorrect() {
  var raw = readJSON(INCORRECT_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(function (q, index) {
      return helpers.normalizeQuestion(q, helpers.toText(q && q.id, 'err-' + index));
    })
    .filter(helpers.isValidQuestion)
    .filter(function (item) {
      return ['err-math', 'err-eng', 'err-phy'].indexOf(item.id) < 0;
    });
}

function saveIncorrect(list) {
  storage.setJSON(INCORRECT_KEY, list || []);
}

function addIncorrect(questions) {
  var incoming = (questions || [])
    .map(function (q) {
      return helpers.normalizeQuestion(q, q && q.id);
    })
    .filter(helpers.isValidQuestion);
  if (incoming.length === 0) return getIncorrect();
  var existing = getIncorrect();
  var map = {};
  existing.forEach(function (q) {
    map[q.id] = q;
  });
  incoming.forEach(function (q) {
    map[q.id] = q;
  });
  var next = Object.keys(map).map(function (id) {
    return map[id];
  });
  saveIncorrect(next);
  return next;
}

function removeIncorrectByIds(questionIds) {
  var idSet = {};
  (questionIds || []).forEach(function (id) {
    if (id) idSet[id] = true;
  });
  var next = getIncorrect().filter(function (q) {
    return !idSet[q.id];
  });
  saveIncorrect(next);
  return next;
}

function getFavorites() {
  var raw = readJSON(FAVORITES_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(function (q, index) {
      return helpers.normalizeQuestion(q, helpers.toText(q && q.id, 'fav-' + index));
    })
    .filter(helpers.isValidQuestion)
    .filter(function (item) {
      return ['fav-math', 'fav-eng'].indexOf(item.id) < 0;
    });
}

function saveFavorites(list) {
  storage.setJSON(FAVORITES_KEY, list || []);
}

function toggleFavorite(question) {
  var normalized = helpers.normalizeQuestion(question, question && question.id);
  if (!normalized) return getFavorites();
  var list = getFavorites();
  var exists = list.some(function (q) {
    return q.id === normalized.id;
  });
  if (exists) {
    list = list.filter(function (q) {
      return q.id !== normalized.id;
    });
  } else {
    list = list.concat([normalized]);
  }
  saveFavorites(list);
  return { list: list, favorited: !exists };
}

function isFavorite(questionId) {
  return getFavorites().some(function (q) {
    return q.id === questionId;
  });
}

function getStats() {
  return helpers.normalizeStudyStats(readJSON(STATS_KEY, helpers.createEmptyStudyStats()));
}

function saveStats(stats) {
  storage.setJSON(STATS_KEY, helpers.normalizeStudyStats(stats));
}

function recordPracticeStats(answered, correct, startedAt) {
  var elapsedSeconds = startedAt
    ? Math.max(30, Math.round((Date.now() - startedAt) / 1000))
    : Math.max(30, answered * 45);
  var today = helpers.getLocalDateKey();
  var yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  var yesterday = helpers.getLocalDateKey(yesterdayDate);
  var prev = getStats();
  var sameDay = prev.lastStudyDate === today;
  var consecutiveDay = prev.lastStudyDate === yesterday;
  var dailyCounts = prev.dailyCounts.slice();
  if (sameDay) {
    dailyCounts[dailyCounts.length - 1] += answered;
  } else {
    dailyCounts.shift();
    dailyCounts.push(answered);
  }
  var totalAnswered = prev.totalAnswered + answered;
  var totalCorrect = prev.totalCorrect + correct;
  var next = {
    todayCount: sameDay ? prev.todayCount + answered : answered,
    totalSessions: prev.totalSessions + 1,
    totalAnswered: totalAnswered,
    totalCorrect: totalCorrect,
    correctRate: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    streakDays: sameDay ? Math.max(prev.streakDays, 1) : consecutiveDay ? prev.streakDays + 1 : 1,
    studySeconds: prev.studySeconds + elapsedSeconds,
    lastStudyDate: today,
    dailyCounts: dailyCounts,
  };
  saveStats(next);
  return next;
}

module.exports = {
  DECKS_KEY,
  INCORRECT_KEY,
  FAVORITES_KEY,
  STATS_KEY,
  isLegacyDemoDeck,
  normalizeDeck,
  getDecks,
  saveDecks,
  getDeckById,
  upsertDeck,
  addDeck,
  deleteDeck,
  updateDeckQuestions,
  markQuestionsMastered,
  getIncorrect,
  saveIncorrect,
  addIncorrect,
  removeIncorrectByIds,
  getFavorites,
  saveFavorites,
  toggleFavorite,
  isFavorite,
  getStats,
  saveStats,
  recordPracticeStats,
};
