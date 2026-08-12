const helpers = require('./helpers');

function getBaseFileName(fileName) {
  return (
    String(fileName || '题库导入')
      .split(/[\\/]/)
      .pop()
      .replace(/\.[^/.]+$/, '')
      .replace(/\s+/g, ' ')
      .trim() || '题库导入'
  );
}

function makeQuestion(partial, index, prefix) {
  return helpers.normalizeQuestion(
    partial,
    (prefix || 'import') + '-' + Date.now().toString(36) + '-' + index,
  );
}

function parseTxt(text, fileName) {
  var blocks = String(text || '')
    .split(/\n\s*\n/)
    .map(function (b) {
      return b.trim();
    })
    .filter(Boolean);
  var questions = [];

  blocks.forEach(function (block, idx) {
    var lines = block
      .split(/\n/)
      .map(function (l) {
        return l.trim();
      })
      .filter(Boolean);
    if (lines.length < 2) return;

    var stem = '';
    var explanation = '';
    var options = [];
    var answer = '';

    lines.forEach(function (line) {
      if (/^(q:|问题:|问:|【?问题】?)/i.test(line)) {
        stem = line.replace(/^(q:|问题:|问:|【?问题】?\s*[:：]?\s*)/i, '');
      } else if (/^(a:|答案:|答:|【?答案】?)/i.test(line)) {
        answer = helpers.normalizeImportedChoiceAnswer(
          line.replace(/^(a:|答案:|答:|【?答案】?\s*[:：]?\s*)/i, ''),
        );
      } else if (/^(解析:|explanation:|exp:|【?解析】?)/i.test(line)) {
        explanation = line.replace(/^(解析:|explanation:|exp:|【?解析】?\s*[:：]?\s*)/i, '');
      } else if (/^(选项:|options:|【?选项】?)/i.test(line)) {
        options = helpers.normalizeChoiceOptions(
          line
            .replace(/^(选项:|options:|【?选项】?\s*[:：]?\s*)/i, '')
            .split(/[|;]/)
            .map(function (o) {
              return o.trim();
            })
            .filter(Boolean),
        );
      } else if (/^(正确选项:|正确答案:|answer:|【?正确答案】?)/i.test(line)) {
        answer = helpers.normalizeImportedChoiceAnswer(
          line.replace(/^(正确选项:|正确答案:|answer:|【?正确答案】?\s*[:：]?\s*)/i, ''),
        );
      }
    });

    if (!stem) {
      var found = lines.find(function (line) {
        return (
          !/^[A-Z]\s*[.．、)]/.test(line) &&
          !/^(正确选项:|正确答案:|答案:|answer:|【?正确答案】?)/i.test(line)
        );
      });
      stem = (found || '').replace(/^\d+[\.\、．]\s*/, '').trim();
    }

    if (options.length === 0) {
      var optionLines = lines.filter(function (line) {
        return /^[A-Z]\s*[.．、)]/.test(line);
      });
      if (optionLines.length >= 2) {
        options = helpers.normalizeChoiceOptions(optionLines);
      }
    }

    if (!answer && lines[1] && !/^[A-Z]\s*[.．、)]/.test(lines[1])) {
      answer = helpers.normalizeImportedChoiceAnswer(lines[1]);
      if (lines[2] && !explanation) explanation = lines[2].trim();
    }

    var q = null;
    if (stem && options.length >= 2 && answer) {
      q = makeQuestion(
        {
          stem: stem,
          options: options,
          answer: answer,
          explanation: explanation || '科学复习，高效掌握。',
        },
        idx,
        'txt',
      );
    } else if (stem && (answer === '是' || answer === '否')) {
      q = makeQuestion(
        {
          stem: stem,
          options: ['是', '否'],
          answer: answer,
          type: 'judge',
          explanation: explanation || '判断题，请选择题干表述是否正确。',
        },
        idx,
        'txt',
      );
    }
    if (q) questions.push(q);
  });

  if (questions.length === 0) {
    throw new Error('无法解析该 TXT。请提供选择题或判断题，并用空行分隔每道题。');
  }

  return {
    name: getBaseFileName(fileName),
    desc: '从 TXT 文本导入，共 ' + questions.length + ' 道题。',
    emoji: '📄',
    questions: questions,
  };
}

function parseJson(text, fileName) {
  var parsed;
  try {
    parsed = JSON.parse(String(text || ''));
  } catch (e) {
    throw new Error('JSON 格式不正确，请检查文件内容。');
  }

  var questions = [];
  var name = getBaseFileName(fileName);
  var emoji = '📦';
  var desc = '';

  if (Array.isArray(parsed)) {
    questions = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.questions)) {
      questions = parsed.questions;
      name = helpers.toText(parsed.name, name);
      emoji = helpers.toText(parsed.emoji, emoji);
      desc = helpers.toText(parsed.desc, '');
    } else if (Array.isArray(parsed.decks)) {
      var merged = [];
      parsed.decks.forEach(function (deck) {
        if (deck && Array.isArray(deck.questions)) {
          merged = merged.concat(deck.questions);
        }
      });
      questions = merged;
      name = helpers.toText(parsed.name, name);
      desc = '从 Spring Nest 备份导入';
    } else {
      throw new Error('JSON 需为题目数组，或包含 questions / decks 字段。');
    }
  } else {
    throw new Error('无法识别的 JSON 结构。');
  }

  var normalized = questions
    .map(function (item, index) {
      return makeQuestion(item, index, 'json');
    })
    .filter(Boolean);

  if (normalized.length === 0) {
    throw new Error('JSON 中没有有效的选择题或判断题。');
  }

  return {
    name: name,
    desc: desc || '从 JSON 导入，共 ' + normalized.length + ' 道题。',
    emoji: emoji,
    questions: normalized,
  };
}

function parseDelimitedRows(text, delimiter) {
  var rows = [];
  var row = [];
  var cell = '';
  var inQuotes = false;

  function pushCell() {
    row.push(cell.trim());
    cell = '';
  }
  function pushRow() {
    pushCell();
    if (
      row.some(function (value) {
        return value.length > 0;
      })
    ) {
      rows.push(row);
    }
    row = [];
  }

  var src = String(text || '');
  for (var index = 0; index < src.length; index++) {
    var char = src[index];
    if (char === '"') {
      if (inQuotes && src[index + 1] === '"') {
        cell += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      pushCell();
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && src[index + 1] === '\n') index++;
      pushRow();
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) pushRow();
  return rows;
}

function normalizeHeaderToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[：:\s]/g, '');
}

function findHeaderIndex(headers, candidates) {
  var set = {};
  candidates.forEach(function (c) {
    set[normalizeHeaderToken(c)] = true;
  });
  for (var i = 0; i < headers.length; i++) {
    if (set[headers[i]]) return i;
  }
  return -1;
}

function looksLikeAnswerCell(value) {
  var answer = helpers.normalizeImportedChoiceAnswer(value);
  return answer === '是' || answer === '否' || /^[A-Z]{1,8}$/.test(answer);
}

function parseCsv(text, fileName) {
  var rows = parseDelimitedRows(text, ',');
  if (rows.length === 0) throw new Error('CSV 内容为空。');

  var firstHeaders = rows[0].map(normalizeHeaderToken);
  var hasHeader = firstHeaders.some(function (header) {
    return (
      [
        'type',
        '类型',
        '题型',
        'question',
        'q',
        '题目',
        '题干',
        '问题',
        'stem',
        'options',
        'choices',
        '选项',
        'answer',
        'correctanswer',
        '答案',
        '参考答案',
        '正确答案',
        '正确选项',
        'optiona',
        'optionb',
        'a',
        'b',
      ].indexOf(header) >= 0
    );
  });

  var questionIndex = hasHeader
    ? findHeaderIndex(firstHeaders, ['question', 'q', '题目', '题干', '问题', 'stem'])
    : -1;
  var optionsIndex = hasHeader ? findHeaderIndex(firstHeaders, ['options', 'choices', '选项']) : -1;
  var answerIndex = hasHeader
    ? findHeaderIndex(firstHeaders, [
        'answer',
        'correctanswer',
        '答案',
        '参考答案',
        '正确答案',
        '正确选项',
      ])
    : -1;
  var explanationIndex = hasHeader
    ? findHeaderIndex(firstHeaders, ['explanation', 'exp', '解析', '解析描述', '答案解析', '说明'])
    : -1;
  var optionColumnIndexes = hasHeader
    ? firstHeaders
        .map(function (header, index) {
          return { header: header, index: index };
        })
        .filter(function (item) {
          return (
            /^(选项)?[a-h]$/.test(item.header) ||
            /^[a-h](选项)?$/.test(item.header) ||
            /^option[a-h]$/.test(item.header)
          );
        })
        .map(function (item) {
          return item.index;
        })
    : [];

  // MVP shortcut: stem,optionA,optionB,optionC,optionD,answer
  if (!hasHeader && rows[0].length >= 6) {
    hasHeader = false;
  } else if (
    hasHeader &&
    optionColumnIndexes.length === 0 &&
    firstHeaders.join(',').indexOf('optiona') >= 0
  ) {
    optionColumnIndexes = ['optiona', 'optionb', 'optionc', 'optiond', 'optione', 'optionf']
      .map(function (key) {
        return findHeaderIndex(firstHeaders, [key]);
      })
      .filter(function (i) {
        return i >= 0;
      });
  }

  var dataRows = hasHeader ? rows.slice(1) : rows;
  var questions = [];

  dataRows.forEach(function (row, rowIndex) {
    var stem = '';
    var answerText = '';
    var explanation = '';
    var options = [];

    if (hasHeader) {
      stem = questionIndex >= 0 ? row[questionIndex] || '' : row[0] || '';
      answerText = answerIndex >= 0 ? row[answerIndex] || '' : '';
      explanation = explanationIndex >= 0 ? row[explanationIndex] || '' : '';
      if (optionsIndex >= 0 && row[optionsIndex]) {
        options = helpers.normalizeChoiceOptions(
          String(row[optionsIndex])
            .split(/[\n|;；]/)
            .map(function (o) {
              return o.trim();
            })
            .filter(Boolean),
        );
      }
      if (options.length < 2 && optionColumnIndexes.length > 0) {
        options = helpers.normalizeChoiceOptions(
          optionColumnIndexes
            .map(function (i) {
              return row[i] || '';
            })
            .filter(Boolean),
        );
      }
    } else {
      // stem, optionA, optionB, optionC, optionD, answer [, explanation]
      stem = row[0] || '';
      var likelyAnswerIndex = -1;
      for (var i = row.length - 1; i >= 1; i--) {
        if (looksLikeAnswerCell(row[i] || '')) {
          likelyAnswerIndex = i;
          break;
        }
      }
      if (likelyAnswerIndex < 0 && row.length >= 6) likelyAnswerIndex = 5;
      answerText = likelyAnswerIndex >= 0 ? row[likelyAnswerIndex] || '' : '';
      explanation = likelyAnswerIndex >= 0 ? row[likelyAnswerIndex + 1] || '' : '';
      var optionCells =
        likelyAnswerIndex > 1
          ? row.slice(1, likelyAnswerIndex).filter(Boolean)
          : row.slice(1, 5).filter(Boolean);
      options = helpers.normalizeChoiceOptions(optionCells);
    }

    var answer = helpers.normalizeImportedChoiceAnswer(answerText);
    stem = String(stem || '')
      .replace(/^\d+\s*[、.．]\s*/, '')
      .trim();
    if (!stem || !answer) return;

    var q = null;
    if (options.length < 2 && (answer === '是' || answer === '否')) {
      q = makeQuestion(
        {
          stem: stem,
          options: ['是', '否'],
          answer: answer,
          type: 'judge',
          explanation: explanation || '判断题，请选择题干表述是否正确。',
        },
        rowIndex,
        'csv',
      );
    } else if (options.length >= 2 && /^[A-Z]{1,8}$/.test(answer)) {
      q = makeQuestion(
        {
          stem: stem,
          options: options,
          answer: answer,
          explanation:
            explanation ||
            (answer.length > 1 ? '多项选择题，请完整选择所有正确项。' : '题库导入答案已同步。'),
        },
        rowIndex,
        'csv',
      );
    }
    if (q) questions.push(q);
  });

  if (questions.length === 0) {
    throw new Error('CSV 中没有有效题目。格式示例：stem,optionA,optionB,optionC,optionD,answer');
  }

  return {
    name: getBaseFileName(fileName),
    desc: '从 CSV 导入，共 ' + questions.length + ' 道题。',
    emoji: '📊',
    questions: questions,
  };
}

function detectAndParse(text, fileName) {
  var name = String(fileName || '').toLowerCase();
  var trimmed = String(text || '').trim();
  if (!trimmed) throw new Error('内容为空。');

  if (name.endsWith('.json') || trimmed.charAt(0) === '[' || trimmed.charAt(0) === '{') {
    try {
      return parseJson(trimmed, fileName || 'import.json');
    } catch (e) {
      if (name.endsWith('.json')) throw e;
    }
  }
  if (
    name.endsWith('.csv') ||
    (trimmed.indexOf(',') >= 0 &&
      trimmed.indexOf('\n') >= 0 &&
      /答案|answer|option/i.test(trimmed.split('\n')[0]))
  ) {
    try {
      return parseCsv(trimmed, fileName || 'import.csv');
    } catch (e) {
      if (name.endsWith('.csv')) throw e;
    }
  }
  return parseTxt(trimmed, fileName || 'import.txt');
}

module.exports = {
  getBaseFileName,
  parseTxt,
  parseJson,
  parseCsv,
  detectAndParse,
};
