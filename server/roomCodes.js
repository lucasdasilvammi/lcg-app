const CODE_LENGTH = 5;
const CODE_CHARACTER_COUNT = 4;
const DEBUG_ROOM_CODE = [2, 2, 2, 2, 2];

const codesMatch = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const buildEasyPublicRoomCodes = () => {
  const codes = [];
  const seen = new Set();
  const addCode = (code) => {
    const key = JSON.stringify(code);
    if (seen.has(key)) return;
    seen.add(key);
    codes.push(code);
  };

  // Prioritize very easy patterns such as AAAAB and AAABB.
  for (let offset = 1; offset < CODE_CHARACTER_COUNT; offset += 1) {
    for (let repeated = 0; repeated < CODE_CHARACTER_COUNT; repeated += 1) {
      const trailing = (repeated + offset) % CODE_CHARACTER_COUNT;
      addCode([repeated, repeated, repeated, repeated, trailing]);
    }
  }

  for (let offset = 1; offset < CODE_CHARACTER_COUNT; offset += 1) {
    for (let repeated = 0; repeated < CODE_CHARACTER_COUNT; repeated += 1) {
      const trailing = (repeated + offset) % CODE_CHARACTER_COUNT;
      addCode([repeated, repeated, repeated, trailing, trailing]);
    }
  }

  for (let firstOffset = 1; firstOffset < CODE_CHARACTER_COUNT; firstOffset += 1) {
    for (let secondOffset = 1; secondOffset < CODE_CHARACTER_COUNT; secondOffset += 1) {
      if (firstOffset === secondOffset) continue;

      for (let repeated = 0; repeated < CODE_CHARACTER_COUNT; repeated += 1) {
        const fourth = (repeated + firstOffset) % CODE_CHARACTER_COUNT;
        const fifth = (repeated + secondOffset) % CODE_CHARACTER_COUNT;
        addCode([repeated, repeated, repeated, fourth, fifth]);
      }
    }
  }

  return codes;
};

const EASY_PUBLIC_ROOM_CODES = buildEasyPublicRoomCodes();

const createRoomCodeGenerator = ({
  random = Math.random,
  useFixedDebugRoomCode = process.env.LCG_USE_FIXED_ROOM_CODE === 'true'
} = {}) => {
  let lastPublicRoomCodeKey = null;
  const createRandomCode = () => Array.from(
    { length: CODE_LENGTH },
    () => Math.floor(random() * CODE_CHARACTER_COUNT)
  );
  const rememberPublicRoomCode = (code) => {
    lastPublicRoomCodeKey = JSON.stringify(code);
    return [...code];
  };

  const generateGameCode = ({
    existingRoomCodes = [],
    reconnectInviteExists = () => false
  } = {}) => {
    if (useFixedDebugRoomCode) return [...DEBUG_ROOM_CODE];

    const usedCodeKeys = new Set(existingRoomCodes.map((code) => JSON.stringify(code)));
    const codeConflicts = (code) => (
      usedCodeKeys.has(JSON.stringify(code))
      || reconnectInviteExists(code)
    );
    const availableEasyCodes = EASY_PUBLIC_ROOM_CODES.filter((code) => !codeConflicts(code));
    const variedEasyCodes = availableEasyCodes.filter(
      (code) => JSON.stringify(code) !== lastPublicRoomCodeKey
    );
    const candidates = variedEasyCodes.length > 0 ? variedEasyCodes : availableEasyCodes;
    const availableEasyCode = candidates[Math.floor(random() * candidates.length)];

    if (availableEasyCode) return rememberPublicRoomCode(availableEasyCode);

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const fallbackCode = createRandomCode();
      if (!codeConflicts(fallbackCode)) return rememberPublicRoomCode(fallbackCode);
    }

    return rememberPublicRoomCode(createRandomCode());
  };

  return {
    generateGameCode,
    generatePrivateCode: createRandomCode,
    generateRoomId: () => random().toString(36).substr(2, 9)
  };
};

module.exports = {
  CODE_CHARACTER_COUNT,
  CODE_LENGTH,
  buildEasyPublicRoomCodes,
  codesMatch,
  createRoomCodeGenerator
};
