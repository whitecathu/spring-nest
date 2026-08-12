function assertFiniteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(name + ' must be a finite number');
  }
}

function createDeadline(durationSeconds, now) {
  assertFiniteNumber(durationSeconds, 'duration');
  if (durationSeconds <= 0) {
    throw new RangeError('duration must be greater than zero');
  }

  var startedAt = now === undefined ? Date.now() : now;
  assertFiniteNumber(startedAt, 'now');
  return startedAt + durationSeconds * 1000;
}

function getRemainingSeconds(deadline, now) {
  assertFiniteNumber(deadline, 'deadline');
  var currentTime = now === undefined ? Date.now() : now;
  assertFiniteNumber(currentTime, 'now');
  return Math.max(0, Math.ceil((deadline - currentTime) / 1000));
}

function isExpired(deadline, now) {
  return getRemainingSeconds(deadline, now) === 0;
}

module.exports = {
  createDeadline,
  getRemainingSeconds,
  isExpired,
};
