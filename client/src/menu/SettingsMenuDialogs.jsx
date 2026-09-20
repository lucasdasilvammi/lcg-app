import ButtonWithIcon from '../components/ButtonWithIcon'
import CharacterCard from '../components/CharacterCard'
import CodeDisplay from '../components/CodeDisplay'
import { CODE_CHARACTERS } from '../data/characters'
import { agree, formatCharacterName } from '../utils/frenchGrammar'
import { MenuColorIcon } from './SettingsMenuPrimitives'

const borderMaskStyle = {
  WebkitMaskImage: 'url(/menu/menu-border-top.svg)',
  maskImage: 'url(/menu/menu-border-top.svg)',
  WebkitMaskSize: '100% auto',
  maskSize: '100% auto',
  WebkitMaskPosition: 'top center',
  maskPosition: 'top center',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat'
}

export default function SettingsMenuDialogs({
  showOrderConfirm,
  isOrderConfirmClosing,
  closeOrderConfirm,
  confirmOrderChange,
  reconnectInvite,
  isReconnectInviteClosing,
  closeReconnectInvite,
  pendingAction,
  isActionConfirmClosing,
  closeActionConfirm,
  confirmPendingAction,
  pendingActionTarget,
  pendingUndoTarget,
  pendingActionDisplayPlayer,
  currentUserPlayer
}) {
  return (
    <>
      {showOrderConfirm && (
        <div
          className="settings-confirm-overlay fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-xs"
          onClick={() => closeOrderConfirm()}
          data-no-longpress
        >
          <div
            className={`settings-confirm-panel relative flex w-full max-w-full max-h-[calc(var(--app-height,100dvh)-16px)] flex-col items-center gap-10 overflow-visible bg-bg px-8 pb-12 pt-12 text-center ${isOrderConfirmClosing ? 'settings-popup-exit' : 'settings-popup-enter'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute -top-2 left-0 h-10 w-full"
              style={{ ...borderMaskStyle, backgroundColor: 'var(--color-light)' }}
            />
            <p className="font-funnel text-xl text-light">
              L'ordre sera effectif après la fin du tour de table actuel !
            </p>
            <ButtonWithIcon
              text="Suivant"
              onClick={confirmOrderChange}
              className="w-full"
            />
          </div>
        </div>
      )}

      {reconnectInvite && (
        <div
          className="settings-confirm-overlay fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-xs"
          onClick={() => closeReconnectInvite()}
          data-no-longpress
        >
          <div
            className={`settings-confirm-panel relative flex w-full max-w-full max-h-[calc(var(--app-height,100dvh)-16px)] flex-col items-center gap-7 overflow-visible bg-bg px-8 pb-12 pt-12 text-center ${isReconnectInviteClosing ? 'settings-popup-exit' : 'settings-popup-enter'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute -top-2 left-0 h-10 w-full bg-light"
              style={borderMaskStyle}
            />

            <p className="font-funnel text-xl leading-snug text-light/80">
              Invitation privée<br />pour inviter :
            </p>

            <div className="flex flex-col items-center gap-2">
              <CharacterCard charId={reconnectInvite.player.character} size="head-only-big" />
              <p className="font-hakobi text-5xl uppercase leading-none" style={{ color: `var(--color-${reconnectInvite.player.character})` }}>
                {reconnectInvite.player.character}
              </p>
            </div>

            <CodeDisplay code={reconnectInvite.code} characters={CODE_CHARACTERS} />

            <ButtonWithIcon
              variant="menu"
              text="Retour"
              icon={<MenuColorIcon src="/menu/icon/enter.svg" />}
              onClick={() => closeReconnectInvite()}
              className="bg-red-secondary text-red-primary"
            />
          </div>
        </div>
      )}

      {pendingAction && (
        <div
          className="settings-confirm-overlay fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-xs"
          onClick={() => closeActionConfirm()}
          data-no-longpress
        >
          <div
            className={`settings-confirm-panel relative flex w-full max-w-full max-h-[calc(var(--app-height,100dvh)-16px)] flex-col items-center gap-8 overflow-visible bg-bg px-8 py-12 text-center ${isActionConfirmClosing ? 'settings-popup-exit' : 'settings-popup-enter'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute -top-2 left-0 h-10 w-full"
              style={{ ...borderMaskStyle, backgroundColor: 'var(--color-light)' }}
            />

            <p className="font-funnel text-xl leading-snug text-light">
              {pendingAction.type === 'promote' && pendingActionTarget && (
                <>Veux-tu vraiment donner à <span style={{ color: `var(--color-${pendingActionTarget.character})` }}>{formatCharacterName(pendingActionTarget.character)}</span> les droits d'administrateur de la partie ?</>
              )}
              {pendingAction.type === 'kick' && pendingActionTarget && (
                <>Veux-tu vraiment expulser <span style={{ color: `var(--color-${pendingActionTarget.character})` }}>{formatCharacterName(pendingActionTarget.character)}</span> de la partie ?</>
              )}
              {pendingAction.type === 'leave' && currentUserPlayer && (
                <>Veux-tu vraiment quitter la partie ? L'administration sera transférée automatiquement.</>
              )}
              {pendingAction.type === 'undo' && pendingUndoTarget && (
                <>En annulant l'action, <span style={{ color: `var(--color-${pendingUndoTarget.character})` }}>{formatCharacterName(pendingUndoTarget.character)}</span> reviendra au choix du type de case sur lequel {agree(pendingUndoTarget.character, 'il est tombé', 'elle est tombée')}.</>
              )}
            </p>

            {pendingAction.type === 'promote' && currentUserPlayer && pendingActionTarget && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <CharacterCard charId={currentUserPlayer.character} size="head-only-big" />
                  <p className="font-hakobi text-5xl uppercase leading-none" style={{ color: `var(--color-${currentUserPlayer.character})` }}>
                    {currentUserPlayer.character}
                  </p>
                </div>
                <img
                  src="/menu/icon/swap.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-12 w-12 object-contain"
                />
                <div className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <CharacterCard charId={pendingActionTarget.character} size="head-only-big" />
                    <img
                      src="/menu/icon/admin-crown.svg"
                      alt=""
                      aria-hidden="true"
                      className="absolute -top-2.5 left-2/5 z-10 h-6 w-6 -translate-x-1/2 -rotate-[15deg]"
                    />
                  </div>
                  <p className="font-hakobi text-5xl uppercase leading-none" style={{ color: `var(--color-${pendingActionTarget.character})` }}>
                    {pendingActionTarget.character}
                  </p>
                </div>
              </div>
            )}

            {pendingAction.type !== 'promote' && pendingActionDisplayPlayer && (
              <div className="flex flex-col items-center gap-1">
                <CharacterCard
                  charId={pendingActionDisplayPlayer.character}
                  size="head-only-big"
                />
                <p
                  className="font-hakobi text-5xl uppercase leading-none"
                  style={{ color: `var(--color-${pendingActionDisplayPlayer.character})` }}
                >
                  {pendingActionDisplayPlayer.character}
                </p>
              </div>
            )}

            <div className="flex w-full items-center justify-center gap-3">
              <ButtonWithIcon
                variant="menu"
                text="Non"
                icon={<MenuColorIcon src="/menu/icon/disconnected.svg" />}
                onClick={() => closeActionConfirm()}
                className="bg-red-secondary text-red-primary"
              />
              <ButtonWithIcon
                variant="menu"
                text="Oui"
                icon={<MenuColorIcon src="/menu/icon/connected.svg" />}
                onClick={confirmPendingAction}
                className="!bg-green-secondary text-green-primary"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
