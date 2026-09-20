import ButtonWithIcon from '../ButtonWithIcon'
import CharacterCard from '../CharacterCard'
import { isIosDevice } from '../../utils/fullscreen'

function PauseIcon({ className = 'h-16 w-16' }) {
  return (
    <span
      aria-hidden="true"
      className={'shrink-0 bg-current ' + className}
      style={{
        WebkitMaskImage: 'url(/menu/icon/pause.svg)',
        maskImage: 'url(/menu/icon/pause.svg)',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat'
      }}
    />
  )
}

export function PauseOverlay({ isAdmin, resumeGame }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-8 text-center backdrop-blur-xs" data-no-longpress>
      <div className="flex w-full flex-col items-center justify-center gap-6">
        <PauseIcon className="h-16 w-16 text-light" />
        <p className="font-hakobi text-3xl uppercase leading-tight text-light">
          {isAdmin ? 'Tu as mis la partie en pause' : 'La partie est en pause'}
        </p>
        {isAdmin && (
          <button
            type="button"
            aria-label="Reprendre la partie"
            onClick={() => resumeGame?.()}
            className="transition active:scale-95"
          >
            <img
              src="/menu/icon/btn-play.svg"
              alt=""
              aria-hidden="true"
              className="h-13 w-auto"
            />
          </button>
        )}
      </div>
    </div>
  )
}

export function IosFullscreenHelp({ reason, onClose }) {
  const isIos = isIosDevice()
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isChromeIos = /CriOS/.test(ua)
  const details = isIos
    ? [
        'Sur iPhone, Safari et Chrome ne peuvent pas lancer le vrai plein écran depuis un bouton.',
        'Ouvre le menu Partager puis choisis Ajouter à l’écran d’accueil.',
        'Relance ensuite Le Cube Graphique depuis l’icône ajoutée.'
      ]
    : [
        'Ton navigateur a refusé la demande de plein écran.',
        'Touche l’écran puis réessaie depuis le menu.'
      ]

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-7 text-center backdrop-blur-xs" data-no-longpress>
      <div className="relative flex w-full max-w-86 flex-col items-center gap-5 bg-bg px-7 py-8 text-light">
        <div className="pointer-events-none absolute inset-0 border border-light/15" />
        <div className="flex flex-col gap-3">
          <h2 className="font-hakobi text-4xl uppercase leading-none text-light">
            {isIos ? 'Plein écran iPhone' : 'Plein écran indisponible'}
          </h2>
          {details.map((line) => (
            <p key={line} className="font-funnel text-base leading-snug text-light/75">{line}</p>
          ))}
          {isChromeIos && (
            <p className="font-funnel text-sm leading-snug text-orange-primary">
              Si l’option n’apparaît pas dans Chrome, ouvre d’abord la partie dans Safari.
            </p>
          )}
          {reason === 'request-failed' && !isIos && (
            <p className="font-funnel text-sm leading-snug text-light/55">
              Certains navigateurs refusent le plein écran si l’action n’est pas déclenchée directement par un tap.
            </p>
          )}
        </div>
        <ButtonWithIcon onClick={onClose} text="J’ai compris" className="w-fit" />
      </div>
    </div>
  )
}

export function ReconnectInviteConfirm({ invite, onConfirm, onCancel }) {
  if (!invite?.character) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-xs" data-no-longpress>
      <div className="relative flex w-full max-w-full flex-col items-center gap-7 overflow-visible bg-bg px-8 pb-12 pt-16 text-center">
        <div
          className="pointer-events-none absolute -top-2 left-0 h-10 w-full bg-light"
          style={{
            WebkitMaskImage: 'url(/menu/menu-border-top.svg)',
            maskImage: 'url(/menu/menu-border-top.svg)',
            WebkitMaskSize: '100% auto',
            maskSize: '100% auto',
            WebkitMaskPosition: 'top center',
            maskPosition: 'top center',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat'
          }}
        />

        <div className="flex flex-col items-center gap-2">
          <CharacterCard charId={invite.character} size="head-only-big" />
          <p className="font-hakobi text-5xl uppercase leading-none" style={{ color: 'var(--color-' + invite.character + ')' }}>
            {invite.character}
          </p>
        </div>

        <p className="max-w-72 font-funnel text-lg leading-snug text-light/80">
          Est-ce que tu confirmes qu'il s'agit bien de ton personnage ?
        </p>

        <div className="flex items-center justify-center gap-3">
          <ButtonWithIcon
            variant="menu"
            text="Non"
            icon={<img src="/menu/icon/disconnected.svg" alt="" aria-hidden="true" className="h-7 w-7" />}
            onClick={onCancel}
            className="bg-red-secondary text-red-primary"
          />
          <ButtonWithIcon
            variant="menu"
            text="Oui"
            icon={<img src="/menu/icon/connected.svg" alt="" aria-hidden="true" className="h-7 w-7" />}
            onClick={onConfirm}
            className="!bg-green-secondary text-green-primary"
          />
        </div>
      </div>
    </div>
  )
}
