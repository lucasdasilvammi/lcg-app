const PICK_DURATION_MS = 15000;
const PICK_PRESSURE_DURATION_MS = 5000;

const createPickDeadline = (now = Date.now()) => now + PICK_DURATION_MS;

const tightenPickDeadline = (deadline, now = Date.now()) => {
  const safeDeadline = Number.isFinite(deadline) ? deadline : createPickDeadline(now);
  return Math.min(safeDeadline, now + PICK_PRESSURE_DURATION_MS);
};

module.exports = {
  PICK_DURATION_MS,
  PICK_PRESSURE_DURATION_MS,
  createPickDeadline,
  tightenPickDeadline
};
