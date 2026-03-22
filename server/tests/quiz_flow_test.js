const io = require('socket.io-client');

const SERVER = process.env.SERVER || 'http://localhost:3002';

function waitForEvent(socket, event, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error('timeout waiting for ' + event));
    }, timeout);
    function onEvent(data) {
      clearTimeout(timer);
      socket.off(event, onEvent);
      resolve(data);
    }
    socket.on(event, onEvent);
  });
}

(async () => {
  console.log('Connecting two clients to', SERVER);
  const a = io.connect(SERVER, { reconnectionDelay: 0, forceNew: true });
  const b = io.connect(SERVER, { reconnectionDelay: 0, forceNew: true });

  await Promise.all([waitForEvent(a, 'connect'), waitForEvent(b, 'connect')]);
  console.log('Clients connected:', a.id, b.id);

  a.on('update_room_state', (room) => console.log('[A] room update -> status', room.status));
  b.on('update_room_state', (room) => console.log('[B] room update -> status', room.status));

  // A creates room
  a.emit('create_room');
  const created = await waitForEvent(a, 'room_created');
  console.log('Room created', created);

  // B joins
  b.emit('join_room_with_code', created.code);
  await waitForEvent(b, 'room_joined');
  console.log('B joined');

  // A triggers QUIZ
  a.emit('trigger_action', 'QUIZ');
  console.log('A triggered QUIZ');
  // wait for QUIZ_OPTIONS state
  let room = await waitForEvent(a, 'update_room_state');
  while (room.status !== 'QUIZ_OPTIONS') {
    room = await waitForEvent(a, 'update_room_state');
  }
  console.log('Room in QUIZ_OPTIONS', room.pendingQuestionerId, room.pendingCategory);

  if (room.pendingQuestionerId !== a.id) {
    console.error('pendingQuestionerId is not A! got', room.pendingQuestionerId);
  }

  // A starts specific quiz
  a.emit('start_specific_quiz', { difficulty: 2 });
  console.log('A started specific quiz (difficulty 2)');

  // Also try B just in case
  setTimeout(() => { b.emit('start_specific_quiz', { difficulty: 3 }); console.log('B (fallback) attempted start_specific_quiz'); }, 500);

  // Wait for INTERACTION (longer timeout)
  room = await waitForEvent(a, 'update_room_state', 10000);
  while (room.status !== 'INTERACTION') {
    room = await waitForEvent(a, 'update_room_state', 10000);
  }
  console.log('Room in INTERACTION', room.currentInteraction);

  // Check readerId === a.id
  const ci = room.currentInteraction;
  console.log('readerId', ci.readerId, 'questionerId', ci.questionerId);

  // A resolves interaction (simulate correct)
  a.emit('resolve_interaction', true);
  console.log('A resolved interaction true');

  // Wait for REVEAL
  room = await waitForEvent(a, 'update_room_state');
  while (room.status !== 'REVEAL') {
    room = await waitForEvent(a, 'update_room_state');
  }
  console.log('Room in REVEAL', room.lastResult);

  if (room.lastResult.questionerId === a.id) {
    console.log('✅ lastResult.questionerId matches A (a.id). The questioner should see the button.');
  } else {
    console.error('❌ lastResult.questionerId does NOT match A, got', room.lastResult.questionerId, 'a.id', a.id);
  }

  // A continues to feedback (A clicked VOIR LE VERDICT)
  a.emit('continue_to_feedback');
  room = await waitForEvent(a, 'update_room_state');
  while (room.status !== 'FEEDBACK') {
    room = await waitForEvent(a, 'update_room_state');
  }
  console.log('Room in FEEDBACK', room.lastResult);

  if (room.lastResult.verdictViewerId === a.id) {
    console.log('✅ verdictViewerId set to A as expected');
  } else {
    console.error('❌ verdictViewerId NOT set to A, got', room.lastResult.verdictViewerId);
  }

  // Cleanup
  a.disconnect();
  b.disconnect();
  process.exit(0);
})().catch(err => {
  console.error('Test error', err);
  process.exit(1);
});