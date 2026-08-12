function pad2(value) {
  var text = String(value);
  return text.length >= 2 ? text : '0' + text;
}

function uid(prefix) {
  return (
    (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
  );
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function getLocalDateKey(date) {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return year + '-' + month + '-' + day;
}

function getDisplayReviewDate(date) {
  const d = date || new Date();
  return d.getMonth() + 1 + '月' + d.getDate() + '日';
}

function toText(value, fallback) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback || '';
}

function normalizeChoiceAnswer(value) {
  var raw = value;
  if (Array.isArray(value)) {
    raw = value.join('');
  }
  return String(raw || '')
    .replace(/[，,、\s]/g, '')
    .replace(/[对错]/g, function (char) {
      return char === '对' ? '是' : '否';
    })
    .replace(/正确|TRUE/gi, '是')
    .replace(/错误|FALSE/gi, '否')
    .toUpperCase();
}

function normalizeImportedChoiceAnswer(value) {
  return normalizeChoiceAnswer(
    String(value || '').replace(/^(正确答案|正确选项|答案|answer|correct answer)\s*[:：]?\s*/i, ''),
  );
}

function normalizeChoiceOptions(options) {
  var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return (options || [])
    .map(function (option, index) {
      var trimmed = String(option || '').trim();
      if (!trimmed) return '';
      if (trimmed === '是' || trimmed === '否') return trimmed;
      if (/^[A-Z][\s.．、)]/.test(trimmed)) return trimmed;
      var label = labels[index] || String(index + 1);
      return label + '. ' + trimmed;
    })
    .filter(Boolean);
}

function optionLetter(option) {
  var trimmed = String(option || '').trim();
  if (trimmed === '是' || trimmed === '否') return trimmed;
  var match = trimmed.match(/^([A-Z])/);
  return match ? match[1] : trimmed.charAt(0);
}

function toggleChoiceAnswer(current, option) {
  var letter = optionLetter(option);
  var normalized = {};
  normalizeChoiceAnswer(current)
    .split('')
    .filter(Boolean)
    .forEach(function (ch) {
      normalized[ch] = true;
    });
  if (normalized[letter]) {
    delete normalized[letter];
  } else {
    normalized[letter] = true;
  }
  return Object.keys(normalized).sort().join('');
}

function detectQuestionKind(question) {
  if (!question) return 'single';
  if (question.type === 'single' || question.type === 'multiple' || question.type === 'judge') {
    return question.type;
  }
  var options = question.options || [];
  var answer = normalizeChoiceAnswer(question.answer);
  if (options.length === 2 && options.indexOf('是') >= 0 && options.indexOf('否') >= 0) {
    return 'judge';
  }
  return answer.length > 1 ? 'multiple' : 'single';
}

function kindLabel(kind) {
  if (kind === 'multiple') return '多项选择';
  if (kind === 'judge') return '判断题';
  return '单项选择';
}

function kindShortLabel(kind) {
  if (kind === 'multiple') return '多选';
  if (kind === 'judge') return '判断';
  return '单选';
}

function isMultiChoiceQuestion(question) {
  return detectQuestionKind(question) === 'multiple';
}

function isChoiceAnswerCorrect(question, answer) {
  return normalizeChoiceAnswer(answer) === normalizeChoiceAnswer(question && question.answer);
}

function answerToStorage(answer) {
  if (Array.isArray(answer)) {
    return normalizeChoiceAnswer(answer);
  }
  return normalizeChoiceAnswer(answer);
}

function normalizeQuestion(raw, id) {
  if (!raw || typeof raw !== 'object') return null;
  var stem = toText(raw.stem, toText(raw.q, toText(raw.question, ''))).trim();
  var options = normalizeChoiceOptions(
    Array.isArray(raw.options)
      ? raw.options
          .map(function (o) {
            return toText(o);
          })
          .filter(Boolean)
      : [],
  );
  var answer = answerToStorage(raw.answer);
  if (!stem || !answer) return null;

  var type = raw.type;
  if (type === 'choice' || !type) {
    type = null;
  }
  if (type !== 'single' && type !== 'multiple' && type !== 'judge') {
    if (options.length < 2 && (answer === '是' || answer === '否')) {
      options = ['是', '否'];
      type = 'judge';
    } else if (options.length < 2) {
      return null;
    } else {
      type =
        answer.length > 1
          ? 'multiple'
          : options.indexOf('是') >= 0 && options.indexOf('否') >= 0 && options.length === 2
            ? 'judge'
            : 'single';
    }
  }
  if (type === 'judge' && options.length < 2) {
    options = ['是', '否'];
  }
  if (options.length < 2) return null;

  return {
    id: toText(raw.id, id || uid('q')),
    type: type,
    stem: stem,
    options: options,
    answer: type === 'multiple' ? answer.split('').sort().join('') : answer,
    explanation: toText(raw.explanation, '') || undefined,
    mastered: Boolean(raw.mastered),
    category: toText(raw.category) || undefined,
    tag: toText(raw.tag) || undefined,
  };
}

function isValidQuestion(question) {
  return Boolean(
    question &&
    question.stem &&
    question.stem.trim().length > 0 &&
    Array.isArray(question.options) &&
    question.options.length > 0 &&
    normalizeChoiceAnswer(question.answer).length > 0,
  );
}

function shuffleQuestions(questions) {
  var shuffled = (questions || []).slice();
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  return shuffled;
}

function sampleQuestions(questions, count) {
  var target = clampNumber(count, 1, Math.max((questions || []).length, 1));
  return shuffleQuestions(questions).slice(0, target);
}

function createEmptyStudyStats() {
  return {
    todayCount: 0,
    correctRate: 0,
    streakDays: 0,
    totalSessions: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    studySeconds: 0,
    dailyCounts: [0, 0, 0, 0, 0, 0, 0],
  };
}

function normalizeStudyStats(input) {
  var fallback = createEmptyStudyStats();
  input = input || {};
  var totalAnswered =
    input.totalAnswered != null ? input.totalAnswered : input.todayCount || fallback.totalAnswered;
  var totalCorrect =
    input.totalCorrect != null
      ? input.totalCorrect
      : Math.round(totalAnswered * ((input.correctRate || 0) / 100));
  var dailyCounts = Array.isArray(input.dailyCounts)
    ? input.dailyCounts.slice(-7)
    : fallback.dailyCounts.slice();
  while (dailyCounts.length < 7) dailyCounts.unshift(0);
  dailyCounts = dailyCounts.slice(-7);
  return {
    todayCount: input.todayCount || 0,
    streakDays: input.streakDays || 0,
    totalSessions: input.totalSessions || 0,
    totalAnswered: totalAnswered,
    totalCorrect: totalCorrect,
    correctRate: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    studySeconds: input.studySeconds || 0,
    lastStudyDate: input.lastStudyDate,
    dailyCounts: dailyCounts,
  };
}

function modeLabel(mode) {
  if (mode === 'exam') return '考试';
  if (mode === 'reccite') return '背题';
  return '刷题';
}

function getQuestionKindStats(questions) {
  var kinds = [
    { kind: 'single', label: '单项选择', shortLabel: '单选' },
    { kind: 'multiple', label: '多项选择', shortLabel: '多选' },
    { kind: 'judge', label: '判断题', shortLabel: '判断' },
  ];
  return kinds.map(function (item) {
    var typed = (questions || []).filter(function (q) {
      return detectQuestionKind(q) === item.kind;
    });
    return {
      kind: item.kind,
      label: item.label,
      shortLabel: item.shortLabel,
      questions: typed,
      count: typed.length,
    };
  });
}

module.exports = {
  pad2,
  uid,
  clampNumber,
  getLocalDateKey,
  getDisplayReviewDate,
  toText,
  normalizeChoiceAnswer,
  normalizeImportedChoiceAnswer,
  normalizeChoiceOptions,
  optionLetter,
  toggleChoiceAnswer,
  detectQuestionKind,
  kindLabel,
  kindShortLabel,
  isMultiChoiceQuestion,
  isChoiceAnswerCorrect,
  normalizeQuestion,
  isValidQuestion,
  shuffleQuestions,
  sampleQuestions,
  createEmptyStudyStats,
  normalizeStudyStats,
  modeLabel,
  getQuestionKindStats,
};
