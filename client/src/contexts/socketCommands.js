export const createSocketCommands = ({
  socket,
  commandContextId,
  setPendingReconnectInvite,
  resetRoomState
}) => {
  const emitGameCommand = (event, payload = {}, ack) => socket?.emit(event, {
    ...payload,
    commandContextId
  }, ack)

  const triggerAction = (actionType) => {
    if (!socket) {
      console.warn('triggerAction called but socket is null', actionType)
      return
    }
    console.log('🎯 triggerAction -> emitting', actionType, 'socket', socket.id, 'connected', socket.connected)
    emitGameCommand(
      'trigger_action',
      typeof actionType === 'string' ? { type: actionType } : actionType,
      (response) => console.log('🎯 triggerAction ack', actionType, response)
    )
  }

  const submitPhoto = (photoData, ack) => {
    if (!socket?.connected) {
      if (typeof ack === 'function') {
        ack({ ok: false, reason: 'Connexion en cours, réessaie dans une seconde.' })
      }
      return
    }

    let settled = false
    const timeout = window.setTimeout(() => {
      if (settled) return
      settled = true
      if (typeof ack === 'function') {
        ack({ ok: false, reason: 'Connexion instable, réessaie.' })
      }
    }, 8000)

    emitGameCommand('activite_submit_photo', { photoData }, (response) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      if (typeof ack === 'function') ack(response)
    })
  }

  const createReconnectInvite = (targetPlayerId, ack) => {
    if (!socket) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'socket_not_ready' })
      return
    }

    let settled = false
    const timeout = window.setTimeout(() => {
      if (settled) return
      settled = true
      console.warn('create_reconnect_invite: no server ack', { targetPlayerId })
      if (typeof ack === 'function') ack({ ok: false, reason: 'server_no_ack' })
    }, 1500)

    socket.emit('create_reconnect_invite', { targetPlayerId }, (response) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      console.log('create_reconnect_invite ack', response)
      if (typeof ack === 'function') ack(response)
    })
  }

  const leaveRoom = () => {
    console.log('🚪 leaveRoom() called, socket:', socket?.id, 'connected:', socket?.connected)
    if (!socket) {
      console.error('❌ leaveRoom: socket is null')
      return
    }

    console.log('📤 emitting leave_room...')
    socket.emit('leave_room', {}, (response) => {
      console.log('✅ leave_room ack received', response)
      resetRoomState()
    })
  }

  const useBonus = (bonusId, payloadOrAck, ack) => {
    const payload = typeof payloadOrAck === 'function' ? {} : (payloadOrAck || {})
    const callback = typeof payloadOrAck === 'function' ? payloadOrAck : ack
    emitGameCommand('use_bonus', { bonusId, ...payload }, callback)
  }

  return {
    createRoom: () => socket?.emit('create_room'),
    joinRoomWithCode: (code) => socket?.emit('join_room_with_code', code),
    startGame: () => socket?.emit('start_game'),
    pickCharacter: (id) => socket?.emit('pick_character', id),
    confirmSelection: () => socket?.emit('confirm_selection'),
    updateTurnOrder: (list) => socket?.emit('update_turn_order', list),
    startGameLoop: () => socket?.emit('start_game_loop'),
    rollDice: () => emitGameCommand('roll_dice'),
    triggerAction,
    startSpecificQuiz: (payload) => emitGameCommand('start_specific_quiz', payload),
    startDuel: () => emitGameCommand('start_duel'),
    acknowledgeRules: () => emitGameCommand('acknowledge_rules'),
    playerBuzz: () => emitGameCommand('player_buzz'),
    resolveInteraction: (result) => emitGameCommand(
      'resolve_interaction',
      typeof result === 'boolean' ? { correct: result } : result
    ),
    zoomReaderVerdict: (correct, fromTimeoutOptions = false, selectedIndex = null) => emitGameCommand(
      'zoom_reader_verdict',
      { correct, fromTimeoutOptions, selectedIndex }
    ),
    continueToFeedback: () => emitGameCommand('continue_to_feedback'),
    nextTurn: () => emitGameCommand('next_turn'),
    startNewRound: () => emitGameCommand('start_new_round'),
    acknowledgeChooseQuizBonus: (ack) => emitGameCommand('ack_choose_quiz_bonus', {}, ack),
    selectQuizDifficulty: (difficulty, ack) => emitGameCommand('select_quiz_difficulty', { difficulty }, ack),
    claimCaseBonus: (ack) => emitGameCommand('claim_case_bonus', {}, ack),
    stealEventBonus: (targetPlayerId, ack) => emitGameCommand('event_steal_bonus', { targetPlayerId }, ack),
    previewEventStealTarget: (targetPlayerId, ack) => emitGameCommand('event_preview_steal_target', { targetPlayerId }, ack),
    swapEventPositions: (targetPlayerId, ack) => emitGameCommand('event_swap_positions', { targetPlayerId }, ack),
    declareFinish: (ack) => emitGameCommand('declare_finish', {}, ack),
    acknowledgeReady: () => emitGameCommand('activite_acknowledge_ready'),
    submitDrawing: () => emitGameCommand('activite_submit_drawing'),
    submitPhoto,
    submitVote: (photoIndex, voteType) => emitGameCommand('activite_vote', { photoIndex, voteType }),
    promoteAdmin: (targetPlayerId, ack) => socket?.emit('promote_admin', { targetPlayerId }, ack),
    kickPlayer: (targetPlayerId, ack) => socket?.emit('kick_player', { targetPlayerId }, ack),
    createReconnectInvite,
    confirmReconnectInvite: (code, ack) => socket?.emit('confirm_reconnect_invite', { code }, (response) => {
      if (response?.ok) setPendingReconnectInvite(null)
      if (typeof ack === 'function') ack(response)
    }),
    dismissReconnectInvite: () => setPendingReconnectInvite(null),
    undoLastAction: (ack) => socket?.emit('undo_last_action', {}, ack),
    pauseGame: (ack) => socket?.emit('pause_game', {}, ack),
    resumeGame: (ack) => socket?.emit('resume_game', {}, ack),
    useBonus,
    debugGiveBonus: (bonusId = 'ctrl-z', quantity = 1, playerId = socket?.id) => {
      socket?.emit('debug_give_bonus', { bonusId, quantity, playerId }, (response) => {
        console.log('debug_give_bonus ack', response)
      })
    },
    leaveRoom
  }
}
