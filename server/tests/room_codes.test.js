const {
  CODE_CHARACTER_COUNT,
  CODE_LENGTH,
  buildEasyPublicRoomCodes,
  codesMatch,
  createRoomCodeGenerator
} = require('../roomCodes');

test('easy public codes remain unique and use the expected format', () => {
  const codes = buildEasyPublicRoomCodes();

  expect(codes).toHaveLength(48);
  expect(new Set(codes.map(code => JSON.stringify(code))).size).toBe(codes.length);
  expect(codes.every(code => (
    code.length === CODE_LENGTH
    && code.every(value => Number.isInteger(value) && value >= 0 && value < CODE_CHARACTER_COUNT)
  ))).toBe(true);
});

test('public codes avoid occupied values and immediate repetition', () => {
  const generator = createRoomCodeGenerator({ random: () => 0 });
  const collisionGenerator = createRoomCodeGenerator({ random: () => 0 });

  const firstCode = generator.generateGameCode();
  const secondCode = generator.generateGameCode();
  const availableCode = collisionGenerator.generateGameCode({
    existingRoomCodes: [firstCode],
    reconnectInviteExists: code => codesMatch(code, secondCode)
  });

  expect(firstCode).toEqual([0, 0, 0, 0, 1]);
  expect(secondCode).toEqual([1, 1, 1, 1, 2]);
  expect(availableCode).toEqual([2, 2, 2, 2, 3]);
});

test('fixed debug codes preserve the development shortcut', () => {
  const generator = createRoomCodeGenerator({
    random: () => 0,
    useFixedDebugRoomCode: true
  });

  expect(generator.generateGameCode()).toEqual([2, 2, 2, 2, 2]);
});

test('private codes and room ids keep their existing shape', () => {
  const values = [0, 0.25, 0.5, 0.75, 0.999];
  const codeGenerator = createRoomCodeGenerator({ random: () => values.shift() });
  const idGenerator = createRoomCodeGenerator({ random: () => 0.5 });

  expect(codeGenerator.generatePrivateCode()).toEqual([0, 1, 2, 3, 3]);
  expect(idGenerator.generateRoomId()).toBe((0.5).toString(36).substr(2, 9));
});

test('code comparison remains ordered and exact', () => {
  expect(codesMatch([0, 1, 2, 3, 0], [0, 1, 2, 3, 0])).toBe(true);
  expect(codesMatch([0, 1, 2, 3, 0], [0, 1, 2, 0, 3])).toBe(false);
  expect(codesMatch([0, 1], [0, 1, 2])).toBe(false);
});
