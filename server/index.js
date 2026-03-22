const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"], methods: ["GET", "POST"] }
});

// --- DATA ---
const CODE_LENGTH = 5;
const MAX_PLAYERS = 6;
const quizData = require('./data/quiz.json');
const duelsData = require('./data/duels.json');

// Flattener la structure par catégorie en un array simple
const QUIZ_DB = Object.keys(quizData)
  .filter(key => key !== '_comment')
  .flatMap(category => quizData[category]);
const CATEGORIES = Object.keys(quizData).filter(key => key !== '_comment');

// Flattener les défis par type
const DUELS_DB = Object.keys(duelsData)
  .filter(key => !key.startsWith('_'))
  .flatMap(type => duelsData[type]);

// Helpers pour filtrer les défis par type
const getDuelsByType = (type) => DUELS_DB.filter(d => d.type === type);
const getRandomHexColor = () => {
  const value = Math.floor(Math.random() * 0xFFFFFF);
  return `#${value.toString(16).padStart(6, '0')}`.toUpperCase();
};
const getRandomDuel = (type = null) => {
  if (type === 'pick') {
    return {
      type: 'pick',
      question: 'Pick la couleur cible',
      targetColor: getRandomHexColor(),
      explanation: 'Trouve la couleur la plus proche possible.'
    };
  }
  if (type) {
    const filtered = getDuelsByType(type);
    return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : DUELS_DB[Math.floor(Math.random() * DUELS_DB.length)];
  }
  return DUELS_DB[Math.floor(Math.random() * DUELS_DB.length)];
};

let rooms = {}; 

const generateRoomId = () => Math.random().toString(36).substr(2, 9);
// const generateGameCode = () => Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * 4));
const generateGameCode = () => [2, 2, 2, 2, 2]; // TEMPORAIRE: 5 Alan pour les tests

io.on('connection', (socket) => {
  console.log('🔌 socket connected:', socket.id);
  const findRoom = () => Object.values(rooms).find(r => r.players.some(p => p.id === socket.id));
  const syncRoom = (room) => io.to(room.id).emit("update_room_state", room);

  // --- LOBBY ---
  socket.on("create_room", () => {
    const newRoomId = generateRoomId();
    const gameCode = generateGameCode();
    console.log('create_room requested by', socket.id, '->', newRoomId, gameCode)
    rooms[newRoomId] = {
      id: newRoomId,
      code: gameCode,
      adminId: socket.id,
      players: [{ id: socket.id, character: null, score: 0 }], 
      status: "LOBBY",
      turnIndex: 0,
      currentInteraction: null,
      lastResult: null,
      pendingCategory: null
    };
    socket.join(newRoomId);
    socket.emit("room_created", { roomId: newRoomId, code: gameCode });
    syncRoom(rooms[newRoomId]);
  });

  socket.on("join_room_with_code", (inputCode) => {
    // Validation: shape and values
    if (!Array.isArray(inputCode) || inputCode.length !== CODE_LENGTH || inputCode.some(i => typeof i !== 'number' || i < 0 || i > 3)) {
      console.warn('join_room_with_code: invalid code shape from', socket.id, inputCode);
      return socket.emit("error_join", "Code invalide.");
    }

    const room = Object.values(rooms).find(r => JSON.stringify(r.code) === JSON.stringify(inputCode));
    if (!room) {
      console.warn('join_room_with_code: room not found for', socket.id, inputCode);
      return socket.emit("error_join", "Salle introuvable.");
    }
    if (room.players.length >= MAX_PLAYERS) {
      console.warn('join_room_with_code: room full', room.id);
      return socket.emit("error_join", "La salle est pleine.");
    }
    if (room.status !== "LOBBY") {
      console.warn('join_room_with_code: game already started', room.id);
      return socket.emit("error_join", "La partie a déjà commencé.");
    }

    // Add player
    socket.join(room.id);
    room.players.push({ id: socket.id, character: null, score: 0 });
    socket.emit("room_joined", { roomId: room.id, isAdmin: false });
    console.log('join_room_with_code: player joined', socket.id, '->', room.id);
    syncRoom(room);
  });

  // --- SETUP ---
  socket.on("start_game", () => { const room = findRoom(); if (room) { room.status = "SELECT_CHARACTER"; syncRoom(room); }});
  socket.on("pick_character", (id) => {
    const room = findRoom();
    if (!room) {
      console.warn('pick_character: player not in room', socket.id);
      return socket.emit('error_pick', 'Tu n\'es dans aucune partie.');
    }
    if (room.status !== 'SELECT_CHARACTER') {
      console.warn('pick_character: wrong phase', room.id, room.status);
      return socket.emit('error_pick', 'Impossible de choisir un personnage maintenant.');
    }
    const validCharacters = ['donatien', 'barbara', 'alan', 'alex', 'lucien', 'lucie', 'virginie', 'tanguy'];
    // Allow null to deselect, or valid character string
    if (id !== null && (typeof id !== 'string' || !validCharacters.includes(id))) {
      console.warn('pick_character: invalid id', id);
      return socket.emit('error_pick', 'Personnage invalide.');
    }
    // Check if character is already taken by someone else (only if picking, not deselecting)
    if (id !== null && room.players.some(p => p.character === id && p.id !== socket.id)) {
      console.warn('pick_character: already taken', id);
      return socket.emit('error_pick', 'Ce personnage est déjà choisi.');
    }
    const player = room.players.find(p => p.id === socket.id);
    if (!player) {
      console.warn('pick_character: cannot find player entry', socket.id);
      return socket.emit('error_pick', 'Erreur interne.');
    }
    player.character = id;
    console.log('pick_character: player', socket.id, 'picked', id, 'in room', room.id);
    syncRoom(room);
  });
  socket.on("unpick_character", () => {
    const room = findRoom();
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    player.character = null;
    console.log('unpick_character: player', socket.id, 'deselected in room', room.id);
    syncRoom(room);
  });
  socket.on("confirm_selection", () => { const room = findRoom(); if (room) { room.status = "DEFINE_ORDER"; syncRoom(room); }});
  socket.on("update_turn_order", (list) => { const room = findRoom(); if (room) { room.players = list; syncRoom(room); }});
  socket.on("start_game_loop", () => { const room = findRoom(); if (room) { room.status = "TURN_START"; room.turnIndex = 0; syncRoom(room); }});
  socket.on("roll_dice", () => { const room = findRoom(); if (room) { room.status = "GAME_LOOP"; syncRoom(room); }});

  // --- ACTIONS ---
  socket.on("trigger_action", (actionType) => {
    const room = findRoom();
    if (!room) return;

    if (actionType === "QUIZ") {
      const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      room.pendingCategory = randomCat;
      room.pendingQuestionerId = socket.id; // who started the quiz configuration
      room.status = "QUIZ_OPTIONS";
      syncRoom(room);
    }
    else if (actionType === "DEFI") {
      // DEBUG MODE: Go to selector screen instead of starting duel directly
      room.status = "DEBUG_DUEL_SELECTOR";
      syncRoom(room);
    }
  });

  // DEBUG: Allow selecting specific duel type for testing
  socket.on("debug_trigger_duel", (defiType) => {
    const room = findRoom();
    if (!room) return;

    const randomDuel = getRandomDuel(defiType); // Get random duel of specific type
    const p1Index = room.turnIndex;
    const p2Index = (room.turnIndex + 1) % room.players.length; 
    const readerIndex = (room.turnIndex + 2) % room.players.length; 
    room.currentInteraction = {
      type: randomDuel.type,
      data: randomDuel,
      duelists: [room.players[p1Index].id, room.players[p2Index].id],
      readerId: room.players[readerIndex].id,
      buzzedPlayerId: null,
      potentialPoints: 3,
      acknowledgedRules: []
    };
    room.status = "DUEL_START";
    syncRoom(room);
  });

  socket.on("start_duel", () => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    room.status = "DUEL_RULES";
    syncRoom(room);
  });

  socket.on("acknowledge_rules", () => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    const duelists = room.currentInteraction.duelists || [];
    const acks = room.currentInteraction.acknowledgedRules || [];

    const isDuelist = duelists.includes(socket.id);

    // Only duelists can ack; avoid duplicates
    if (isDuelist && !acks.includes(socket.id)) {
      room.currentInteraction.acknowledgedRules = [...acks, socket.id];
    }

    const updatedAcks = room.currentInteraction.acknowledgedRules || [];
    const allAcknowledged = duelists.length > 0 && duelists.every(id => updatedAcks.includes(id));

    // Move to DUEL_GAME only when both duelists acknowledged
    if (allAcknowledged) {
      room.status = "DUEL_GAME";
    }

    syncRoom(room);
  });

  // --- CHIFFRES DUEL ---
  socket.on("chiffres_answer_update", ({ playerId, answer, roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Store answer temporarily for each player
    if (!room.duelAnswers) room.duelAnswers = {};
    room.duelAnswers[playerId] = answer;
    
    // Broadcast to all players in room (especially the reader)
    io.to(roomId).emit("chiffres_answer_update", { playerId, answer });
  });

  socket.on("chiffres_answer_submit", ({ playerId, answer, roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Store the submitted answer
    if (!room.duelAnswers) room.duelAnswers = {};
    room.duelAnswers[playerId] = answer;
    
    // Mark player as submitted with timestamp
    if (!room.currentInteraction.submittedAnswers) {
      room.currentInteraction.submittedAnswers = {};
    }
    if (!room.currentInteraction.submissionOrder) {
      room.currentInteraction.submissionOrder = [];
    }
    
    room.currentInteraction.submittedAnswers[playerId] = parseInt(answer.join(''));
    room.currentInteraction.submissionOrder.push(playerId); // Track submission order
    
    // Check if both duelists have submitted
    const duelists = room.currentInteraction.duelists || [];
    const allSubmitted = duelists.every(id => room.currentInteraction.submittedAnswers[id] !== undefined);
    
    if (allSubmitted) {
      // Calculer le gagnant basé sur la réponse la plus proche de la bonne réponse
      const correctValue = room.currentInteraction.data.correct;
      const player1Id = duelists[0];
      const player2Id = duelists[1];
      const player1Answer = room.currentInteraction.submittedAnswers[player1Id];
      const player2Answer = room.currentInteraction.submittedAnswers[player2Id];
      
      const distance1 = Math.abs(player1Answer - correctValue);
      const distance2 = Math.abs(player2Answer - correctValue);
      
      let winnerId = null;
      if (distance1 < distance2) {
        winnerId = player1Id;
      } else if (distance2 < distance1) {
        winnerId = player2Id;
      } else {
        // En cas d'égalité de distance, le premier à avoir soumis gagne
        winnerId = room.currentInteraction.submissionOrder[0];
      }
      
      // Créer lastResult pour le feedback
      room.lastResult = {
        success: true,
        type: 'chiffres',
        winnerId: winnerId,
        points: 3,
        player1Answer: player1Answer,
        player2Answer: player2Answer,
        correctAnswer: correctValue,
        duelists: duelists,
        readerId: room.currentInteraction.readerId,
        questionerId: room.currentInteraction.readerId
      };
      
      // Ajouter les points au gagnant
      if (winnerId) {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += 3;
      }
      
      // Passer en mode DUEL_REVEAL
      room.status = "DUEL_REVEAL";
    }
    
    syncRoom(room);
  });

  // --- PICK DUEL ---
  socket.on("pick_color_submit", ({ color }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;

    const playerId = socket.id;
    const duelists = room.currentInteraction.duelists || [];
    if (!duelists.includes(playerId)) return;

    if (!room.currentInteraction.submittedColors) {
      room.currentInteraction.submittedColors = {};
    }
    if (!room.currentInteraction.submissionOrder) {
      room.currentInteraction.submissionOrder = [];
    }

    if (room.currentInteraction.submittedColors[playerId]) return;

    room.currentInteraction.submittedColors[playerId] = color;
    room.currentInteraction.submissionOrder.push(playerId);

    const allSubmitted = duelists.every(id => room.currentInteraction.submittedColors[id] !== undefined);

    if (allSubmitted) {
      // Calculate color distances
      const hexToRgb = (hex) => {
        if (!hex) return null;
        const clean = hex.replace('#', '');
        if (clean.length !== 6) return null;
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        return { r, g, b };
      };
      
      const colorDistance = (hex1, hex2) => {
        const c1 = hexToRgb(hex1);
        const c2 = hexToRgb(hex2);
        if (!c1 || !c2) return null;
        const dr = c1.r - c2.r;
        const dg = c1.g - c2.g;
        const db = c1.b - c2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
      };
      
      const targetColor = room.currentInteraction.data?.targetColor;
      const player1Id = duelists[0];
      const player2Id = duelists[1];
      const player1Color = room.currentInteraction.submittedColors[player1Id];
      const player2Color = room.currentInteraction.submittedColors[player2Id];
      
      const distance1 = colorDistance(player1Color, targetColor);
      const distance2 = colorDistance(player2Color, targetColor);
      
      let winnerId = null;
      if (distance1 !== null && distance2 !== null) {
        if (distance1 < distance2) {
          winnerId = player1Id;
        } else if (distance2 < distance1) {
          winnerId = player2Id;
        } else {
          winnerId = room.currentInteraction.submissionOrder[0];
        }
      }
      
      room.lastResult = {
        type: 'pick',
        duelists,
        targetColor,
        submittedColors: room.currentInteraction.submittedColors,
        readerId: room.currentInteraction.readerId,
        winnerId,
        points: 3,
        success: true
      };
      
      // Award points
      if (winnerId) {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += 3;
      }
      
      room.status = "DUEL_REVEAL";
    }

    syncRoom(room);
  });

  // Real-time color updates for spectators
  socket.on("pick_color_update", ({ hue, saturation, lightness }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;

    const playerId = socket.id;
    const duelists = room.currentInteraction.duelists || [];
    if (!duelists.includes(playerId)) return;

    // Broadcast to all players in the room except sender
    socket.to(room.id).emit("pick_color_update", {
      playerId,
      hue,
      saturation,
      lightness
    });
  });

  // Notify opponent when a player submits
  socket.on("pick_opponent_submitted", ({ playerId }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;

    const duelists = room.currentInteraction.duelists || [];
    if (!duelists.includes(playerId) || !duelists.includes(socket.id)) return;

    // Find the opponent (the other duelist)
    const opponentId = duelists.find(id => id !== playerId);
    if (!opponentId) return;

    // Send to the opponent only
    io.to(opponentId).emit("pick_opponent_submitted", { playerId });
  });

  socket.on("start_specific_quiz", ({ difficulty }) => {
    const room = findRoom();
    if (!room) return;
    console.log('start_specific_quiz called by', socket.id, 'difficulty', difficulty, 'pendingQuestionerId', room.pendingQuestionerId);
    const category = room.pendingCategory || "Culture graphique";
    let matching = QUIZ_DB.filter(q => q.diff === difficulty && q.category === category);
    if (matching.length === 0) matching = QUIZ_DB;
    
    const selectedQuestion = matching[Math.floor(Math.random() * matching.length)];
    // The player who landed chooses the difficulty, but the NEXT player (turnIndex + 1) must pose/validate the question
    const nextPlayer = room.players[(room.turnIndex + 1) % room.players.length];
    const questionerId = nextPlayer?.id || room.pendingQuestionerId || socket.id;
    room.currentInteraction = {
      type: "QUIZ",
      data: selectedQuestion,
      readerId: questionerId,
      questionerId,
      potentialPoints: difficulty
    };
    // cleanup pending state
    delete room.pendingQuestionerId;
    // keep pendingCategory if you want to reuse it, or clear it
    room.pendingCategory = null;

    room.status = "INTERACTION";
    syncRoom(room);
  });

  socket.on("player_buzz", () => {
    const room = findRoom();
    if (room && room.currentInteraction && !room.currentInteraction.buzzedPlayerId) {
      room.currentInteraction.buzzedPlayerId = socket.id;
      syncRoom(room);
    }
  });

  // --- RÉSOLUTION ---
  socket.on("resolve_interaction", (data) => { 
    const room = findRoom();
    if (!room) return;

    // Handle both old format (boolean) and new format (object)
    const result = typeof data === 'boolean' ? data : data.correct;
    const selectedIndex = typeof data === 'boolean' ? null : data.selectedIndex;

    let winnerId = null;
    let points = 0;
    
    if (room.currentInteraction.type === "QUIZ") {
      // Quiz: the player who answered correctly wins
      if (result === true) {
        winnerId = room.players[room.turnIndex].id;
        points = room.currentInteraction.potentialPoints || 0;
        room.players.find(p => p.id === winnerId).score += points;
      }
    } else if (room.currentInteraction.type === "buzzer" || room.currentInteraction.type === "vraioufaux") {
      // Duel (buzzer ou vraioufaux): the player who buzzed wins if correct; other duelist wins if wrong
      if (result === true) {
        winnerId = room.currentInteraction.buzzedPlayerId;
      } else {
        // The other duelist wins
        const otherDuelistId = room.currentInteraction.duelists.find(id => id !== room.currentInteraction.buzzedPlayerId);
        winnerId = otherDuelistId;
      }
      
      if (winnerId) {
        points = room.currentInteraction.potentialPoints || 0;
        room.players.find(p => p.id === winnerId).score += points;
      }
    }

    // On prépare le résultat
    const buzzedPlayerObj = room.players.find(p => p.id === room.currentInteraction.buzzedPlayerId);
    room.lastResult = {
      success: result,
      type: room.currentInteraction.type,
      winnerId: winnerId,
      points: points,
      selectedIndex: selectedIndex,
      buzzedPlayerId: room.currentInteraction.buzzedPlayerId,
      buzzedPlayerCharacter: buzzedPlayerObj?.character,
      // Ensure questionerId is set: prefer stored questionerId, fallback to readerId or current turn player
      questionerId: room.currentInteraction?.questionerId || room.currentInteraction?.readerId || room.players[room.turnIndex].id,
      correctAnswer: Array.isArray(room.currentInteraction?.data?.options)
        ? room.currentInteraction.data.options[room.currentInteraction.data.correct]
        : room.currentInteraction.data.answer
    };

    // Passer en mode REVEAL (duel ou quiz)
    room.status = room.currentInteraction.type === "QUIZ" ? "REVEAL" : "DUEL_REVEAL"; 
    syncRoom(room);
  });

  // --- NOUVEAU : TRANSITION REVEAL -> FEEDBACK ---
  socket.on("continue_to_feedback", () => {
    const room = findRoom();
    if (room) {
      // record who clicked 'voir le verdict' so only that player can advance
      if (room.lastResult) {
        room.lastResult.verdictViewerId = socket.id;
      }
      room.status = "FEEDBACK";
      // Là on peut nettoyer l'interaction car on a l'info dans lastResult
      room.currentInteraction = null; 
      syncRoom(room);
    }
  });

  // --- NEXT TURN ---
  socket.on("next_turn", () => {
    const room = findRoom();
    if (!room) return;
    const nextIndex = (room.turnIndex + 1) % room.players.length;
    if (nextIndex === 0) room.status = "ROUND_END";
    else { room.turnIndex = nextIndex; room.status = "TURN_START"; }
    syncRoom(room);
  });

  socket.on("start_new_round", () => {
    const room = findRoom();
    if (room) { room.turnIndex = 0; room.status = "TURN_START"; syncRoom(room); }
  });

  socket.on('disconnect', () => {
    const room = findRoom();
    if (room) {
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) delete rooms[room.id];
      else syncRoom(room);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => { console.log('SERVEUR EN LIGNE SUR PORT', PORT); });