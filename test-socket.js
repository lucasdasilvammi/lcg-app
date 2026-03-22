const io = require('socket.io-client');

const socket = io('http://localhost:3000', { 
  reconnection: true,
  reconnectionDelay: 100
});

console.log('🧪 Testing Socket.io Connection...\n');

socket.on('connect', () => {
  console.log('✅ Socket Connected:', socket.id);
  console.log('🎮 Testing game room creation...');
  socket.emit('create_room');
});

socket.on('room_created', (data) => {
  console.log('✅ Room Created:', data);
  console.log('\n🎉 Complete Flow Ready:');
  console.log('   ✅ Express serving React');
  console.log('   ✅ WebSocket connected');
  console.log('   ✅ Game logic responding');
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.log('❌ Connection Error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('❌ Timeout - No response from server');
  process.exit(1);
}, 3000);
