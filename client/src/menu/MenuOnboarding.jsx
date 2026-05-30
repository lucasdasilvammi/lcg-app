import { useEffect, useRef, useState } from 'react'

const SHOW_CALLOUT_ARROWS = false
const BOTTOM_NAV_HEIGHT = 52

const PLAYER_STEPS = [
  {
    id: 'rules',
    index: '01/05',
    title: 'Présentation détaillée des règles du jeu',
    label: 'Règles',
    arrow: '/menu/on-boarding/arrow-01.svg',
    calloutClassName: 'left-0 right-0 -top-42',
    arrowClassName: '-bottom-22 right-48',
    spotlight: 'rules'
  },
  {
    id: 'fullscreen',
    index: '02/05',
    title: 'Mode plein écran',
    label: 'Fullscreen',
    arrow: '/menu/on-boarding/arrow-02.svg',
    calloutClassName: 'left-0 right-0 -top-32',
    arrowClassName: '-bottom-18 right-12 h-24 rotate-[7deg]',
    spotlight: 'fullscreen'
  },
  {
    id: 'close',
    index: '03/05',
    title: 'Fermer le menu',
    label: 'Fermer le menu',
    arrow: '/menu/on-boarding/arrow-03.svg',
    calloutClassName: 'left-0 right-0 -top-32',
    arrowClassName: '-bottom-16 right-12 h-22 rotate-[4deg]',
    spotlight: 'close'
  },
  {
    id: 'lobby',
    index: '04/05',
    title: 'Le menu lobby',
    text: "C'est dans cette partie que tu retrouves la liste des joueurs et leur état dans la partie. Tu peux également voir qui est l'administrateur de la partie car c'est un menu qui lui est plus utile qu'aux autres joueurs.",
    label: 'Menu Lobby',
    arrow: '/menu/on-boarding/arrow-01.svg',
    calloutClassName: 'left-0 right-0 -top-58',
    arrowClassName: '-bottom-18 left-18 h-18 rotate-[38deg]',
    spotlight: 'lobby'
  },
  {
    id: 'bonus',
    index: '05/05',
    title: 'Le menu bonus',
    text: "C'est dans ce menu que tu vas pouvoir retrouver la liste des bonus que tu as en ta possession. Tu pourras alors lire leur description et les utiliser ici. Tu trouveras aussi le nombre de jalons et de bonus des autres joueurs de la partie.",
    label: 'Menu Bonus',
    arrow: '/menu/on-boarding/arrow-04.svg',
    calloutClassName: 'left-0 right-0 -top-58',
    arrowClassName: '-bottom-18 right-10 h-18 rotate-[8deg]',
    spotlight: 'bonus'
  }
]

const ADMIN_STEPS = [
  { ...PLAYER_STEPS[0], image: '/menu/on-boarding/menu-lobby-assets-01.png' },
  { ...PLAYER_STEPS[1], image: '/menu/on-boarding/menu-lobby-assets-01.png' },
  { ...PLAYER_STEPS[2], image: '/menu/on-boarding/menu-lobby-assets-01.png' },
  {
    id: 'lobby',
    title: 'Le menu lobby',
    text: "C'est dans cette partie du menu que tu retrouveras la liste des joueurs et que tu pourras effectuer certaines actions.",
    label: 'Menu Lobby',
    navIcon: 'lobby',
    image: '/menu/on-boarding/menu-lobby-assets-01.png',
    calloutClassName: 'left-0 right-0 -top-44',
    spotlight: 'lobby'
  },
  {
    id: 'admin',
    title: "Tu es l'admin de la partie",
    text: "Vu que c'est toi qui as créé la partie, tu es admin du lobby. Concrètement ça veut dire que tu es le seul à pouvoir faire les choses suivantes.",
    label: 'Admin',
    navIcon: 'lobby',
    image: '/menu/on-boarding/menu-lobby-assets-05.png',
    calloutClassName: 'left-0 right-0 -top-44',
    spotlight: 'lobby'
  },
  {
    id: 'turn-order',
    title: "Le changement d'ordre",
    text: "Si en pleine partie tu dois te déplacer, tu pourras changer l'ordre des joueurs ici.",
    label: "Changement d'ordre",
    navIcon: 'lobby',
    image: '/menu/on-boarding/menu-lobby-assets-06.png',
    calloutClassName: 'left-0 right-0 -top-40',
    spotlight: 'lobby'
  },
  {
    id: 'connection-state',
    title: 'Les états de connexion',
    text: "C'est ici que tu peux voir si les joueurs sont bien connectés, qu'ils ont crash ou qu'ils sont déconnectés. Peu importe la situation, ils pourront toujours revenir dans la partie.",
    label: 'États de connexion',
    navIcon: 'lobby',
    image: '/menu/on-boarding/menu-lobby-assets-07.png',
    calloutClassName: 'left-0 right-0 -top-48',
    spotlight: 'lobby'
  },
  {
    id: 'leave-player',
    title: 'Quitter la partie',
    text: "Si tu dois quitter la partie mais que les joueurs veulent la terminer, tu peux quitter et un autre admin sera désigné automatiquement.",
    label: 'Quitter la partie',
    navIcon: 'lobby',
    image: '/menu/on-boarding/menu-lobby-assets-08.png',
    calloutClassName: 'left-0 right-0 -top-44',
    spotlight: 'lobby'
  },
  {
    id: 'kick-player',
    title: 'Expulser un joueur',
    text: "Si un joueur a un problème technique, qu'il reste connecté alors qu'il ne peut plus accéder à son personnage, tu peux le kick pour le réinviter.",
    label: 'Expulser un joueur',
    navIcon: 'lobby',
    image: '/menu/on-boarding/menu-lobby-assets-09.png',
    calloutClassName: 'left-0 right-0 -top-44',
    spotlight: 'lobby'
  },
  {
    id: 'promote-admin',
    title: 'Promouvoir admin',
    text: "Si tu ne veux plus être admin de la room, c'est avec ce bouton que tu pourras céder tes pouvoirs.",
    label: 'Promouvoir admin',
    navIcon: 'lobby',
    image: '/menu/on-boarding/menu-lobby-assets-10.png',
    calloutClassName: 'left-0 right-0 -top-40',
    spotlight: 'lobby'
  },
  {
    id: 'undo-action',
    title: "Annuler l'action",
    text: "Si par malheur un joueur se trompe de case en l'indiquant à l'application, tu peux annuler l'action et le joueur sera de retour sur l'écran de choix de la case.",
    label: 'Explication générale',
    navIcon: 'lobby',
    image: '/menu/on-boarding/menu-lobby-assets-11.png',
    calloutClassName: 'left-0 right-0 -top-48',
    spotlight: 'lobby'
  },
  {
    id: 'pause',
    title: 'Mettre en pause',
    text: "Si quelqu'un doit s'absenter et que tu veux être sûr que personne ne fera rien, tu peux mettre la partie en pause.",
    label: 'Mettre en pause',
    navIcon: 'lobby',
    image: '/menu/on-boarding/menu-lobby-assets-12.png',
    calloutClassName: 'left-0 right-0 -top-44',
    spotlight: 'lobby'
  },
  PLAYER_STEPS[4]
]

function getOnboardingSteps(variant) {
  const steps = variant === 'admin' ? ADMIN_STEPS : PLAYER_STEPS
  const total = String(steps.length).padStart(2, '0')

  return steps.map((step, index) => ({
    ...step,
    index: `${String(index + 1).padStart(2, '0')}/${total}`
  }))
}

function MenuColorIcon({ src, className = 'h-7 w-7' }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 bg-current ${className}`}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
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

function RulesIcon({ disabled }) {
  const shellFill = disabled ? '#282726' : '#FFF6EF'

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-full w-full">
      <path d="M49.5 37.1494L49.1768 37.7217L44.9385 45.2295L44.5215 45.9668L43.7432 46.2988L36.7197 49.2988L36.249 49.5H16.9707L16.4844 49.2832L7.32031 45.1982L6.28906 44.7393L5.95215 43.6621L2.61426 32.9932L2.5 32.6279V11.8779L3.7207 11.1504L17.6514 2.85254L18.2432 2.5H36.1406L36.5234 2.62695L43.5469 4.95215L44.6387 5.31348L45.0752 6.37793L49.3135 16.7324L49.5 17.1875V37.1494Z" fill={shellFill} stroke="#101010" strokeWidth="5" />
      <path d="M30.5085 14.2161L30.9183 17.7H34.8122M34.8122 17.7L30.5085 14.2161H17.1875L18.6221 22.4136L17.1875 36.9642L30.3035 37.7839L34.8122 36.9642L34.1974 29.5864L34.8122 17.7Z" stroke="#101010" strokeWidth="3.5" />
      <path d="M22.1327 20.4788L29.5237 20.8105L30.2314 24.0001L22 23.6308L22.1327 20.4788Z" fill="#101010" />
      <path d="M26.6196 33.8564L22.964 33.4047L22.1329 33.4047L22.1329 30.25L23.3398 30.25L26.0898 30.5001L29.4184 30.6668L30.3398 33.8564L26.6196 33.8564Z" fill="#101010" />
      <path d="M25.2988 25.3105L28.9544 25.7622L29.7855 25.7622L29.7855 28.9169L28.5786 28.9169L25.8286 28.6669L22.5 28.5002L21.5786 25.3105L25.2988 25.3105Z" fill="#101010" />
    </svg>
  )
}

function FullscreenIcon({ disabled }) {
  const shellFill = disabled ? '#282726' : '#FFF6EF'

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-full w-full">
      <path d="M49.5 37.1494L49.1768 37.7217L44.9385 45.2295L44.5215 45.9668L43.7432 46.2988L36.7197 49.2988L36.249 49.5H16.9707L16.4844 49.2832L7.32031 45.1982L6.28906 44.7393L5.95215 43.6621L2.61426 32.9932L2.5 32.6279V11.8779L3.7207 11.1504L17.6514 2.85254L18.2432 2.5H36.1406L36.5234 2.62695L43.5469 4.95215L44.6387 5.31348L45.0752 6.37793L49.3135 16.7324L49.5 17.1875V37.1494Z" fill={shellFill} stroke="#101010" strokeWidth="5" />
      <path d="M17.9383 28.9651L18.5626 31.4542L18.5644 31.4906L18.6106 32.6801L22.6438 33.091L22.8287 33.1096L22.9203 33.2684L23.4644 34.21L23.5212 34.3087L23.1941 37.4246L14.4308 36.5337L14.1165 28.5102L17.9383 28.9651ZM35.5181 28.0517L37.542 28.4045L37.8629 28.4608L37.2562 36.5107L33.3851 36.9674H33.3626L29.753 36.9553L28.9451 33.2057L33.1984 32.7031L33.3516 30.1534L33.3543 30.1049L34.0701 28.0466H35.4869L35.5181 28.0517ZM21.0562 14.0055L23.1465 14.1618L23.4142 15.9375L23.4164 15.9505L23.4173 15.963L23.5776 18.0854L18.884 18.4266L18.5688 20.752L18.5657 20.7732L18.5604 20.794L17.9375 23.1632L16.1236 23.4324L16.073 23.4398L16.0224 23.4333L13.8774 23.1524L15.0591 14.4384L21.0021 14.0055L21.0294 14.0038L21.0562 14.0055ZM30.5094 13.9263L36.3643 14.1393L36.6654 14.1505L37.8774 22.4913L33.861 22.7905L33.3741 21.5256L33.36 21.4892L33.3547 21.4503L32.892 18.2712L28.2522 18.1023L28.3332 15.9535L28.3371 15.931L28.6017 14.3704L30.4107 13.9362L30.4592 13.9246L30.5094 13.9263Z" fill="#101010" />
    </svg>
  )
}

function CloseIcon({ disabled }) {
  const shellFill = disabled ? '#282726' : '#FFF6EF'

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-full w-full">
      <path d="M49.5 37.1494L49.1768 37.7217L44.9385 45.2295L44.5215 45.9668L43.7432 46.2988L36.7197 49.2988L36.249 49.5H16.9707L16.4844 49.2832L7.32031 45.1982L6.28906 44.7393L5.95215 43.6621L2.61426 32.9932L2.5 32.6279V11.8779L3.7207 11.1504L17.6514 2.85254L18.2432 2.5H36.1406L36.5234 2.62695L43.5469 4.95215L44.6387 5.31348L45.0752 6.37793L49.3135 16.7324L49.5 17.1875V37.1494Z" fill={shellFill} stroke="#101010" strokeWidth="5" />
      <path fillRule="evenodd" clipRule="evenodd" d="M16.8346 20.26L19.4222 23.1293L22.4805 26.1877L19.4688 28.9005L16.9722 31.3971L16.207 32.5099L16.3684 33.0395L19.0035 35.3063L19.8127 35.4904L22.5945 33.0718L25.8155 29.5227L29.7399 33.8515L31.9011 35.7173L32.5195 35.4171L34.1787 33.7579L35.0823 32.244L34.3813 31.0552L32.3634 29.0374L29.2935 26.0447L31.2695 24.3968L34.6208 20.7174L35.3059 19.8258L35.1487 19.1739L33.3125 16.8238L32.5079 16.4L30.3565 18.1672L28.5926 19.8083L26.0125 22.5113L23.2471 19.3697L20.8741 16.9967L19.9518 16.2699L19.1361 16.98L16.7 19.741L16.8346 20.26Z" fill="#101010" />
    </svg>
  )
}

function FakeIconButton({ type, label, active }) {
  const disabled = !active
  const icons = {
    rules: <RulesIcon disabled={disabled} />,
    fullscreen: <FullscreenIcon disabled={disabled} />,
    close: <CloseIcon disabled={disabled} />
  }

  return (
    <div
      aria-label={label}
      className={`flex h-12 w-12 items-center justify-center transition ${
        active ? 'scale-110 opacity-100' : 'opacity-100'
      }`}
    >
      {icons[type]}
    </div>
  )
}

function FakeMenuButton({ text, icon, active }) {
  return (
    <div
      className={`relative flex h-12 min-w-24 items-center justify-center gap-1 px-3 ${
        active ? 'bg-light text-bg opacity-100' : 'bg-light/10 text-bg opacity-100'
      }`}
    >
      <svg
        width="44"
        height="56"
        viewBox="0 0 44 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -left-0.75 top-1/2 h-12.5 -translate-y-1/2"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M43.4953 0H0V39.8779V55.4838H17.618L3.56385 51.1631L0 39.8779L3.56388 8.77765L43.4953 0Z"
          fill="#101010"
        />
      </svg>

      <div className="relative z-10 flex items-center justify-center gap-1">
        {active && icon}
        <span className="-mb-2 font-hakobi text-3xl uppercase">{text}</span>
      </div>

      <svg
        width="34"
        height="56"
        viewBox="0 0 34 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -right-0.75 top-1/2 h-12.5 -translate-y-1/2"
      >
        <path
          d="M28.8504 44.3695L33.3757 13.412L28.8504 2.45959L0 0H33.3757V13.412V55.4837H6.75606L23.1684 51.2791L28.8504 44.3695Z"
          fill="#101010"
        />
      </svg>
    </div>
  )
}

function Callout({ step }) {
  const titleClassName = step.text
    ? 'font-hakobi text-[42px] uppercase leading-none text-light'
    : 'whitespace-pre-line font-hakobi text-[42px] uppercase leading-10 text-light'

  return (
    <div className={`pointer-events-none absolute z-20 flex flex-col items-center justify-center text-center px-6 ${step.calloutClassName}`}>
      <h2 className={titleClassName}>{step.title}</h2>
      {step.text && (
        <p className="mt-2 max-w-72 font-funnel text-base font-normal leading-tight text-light">
          {step.text}
        </p>
      )}
      {SHOW_CALLOUT_ARROWS && (
        <img
          src={step.arrow}
          alt=""
          aria-hidden="true"
          className={`pointer-events-none absolute object-contain ${step.arrowClassName}`}
        />
      )}
    </div>
  )
}

function ContentPreview({ step }) {
  const isBonus = step.id === 'bonus'
  const hasCustomImage = Boolean(step.image)
  const isIntroStep = step.id === 'rules' || step.id === 'fullscreen' || step.id === 'close'
  const lobbyOpacity = step.id === 'lobby' ? 'opacity-50' : 'opacity-10'
  const customImageOpacity = isIntroStep ? 'opacity-10' : 'opacity-100'
  const toggleOpacity = step.id === 'rules' || step.id === 'fullscreen' || step.id === 'close'
    ? 'opacity-10'
    : 'opacity-100'

  return (
    <div className="flex min-h-0 w-full flex-col items-center gap-6">
      <div className={`flex w-full scale-[0.9] justify-center gap-3 ${toggleOpacity}`}>
        <FakeMenuButton
          text="Lobby"
          active={!isBonus}
          icon={<img src="/menu/icon/crown.svg" alt="" aria-hidden="true" className="h-7 w-7" />}
        />
        <FakeMenuButton
          text="Bonus"
          active={isBonus}
          icon={<img src="/menu/icon/bonus.svg" alt="" aria-hidden="true" className="h-7 w-7" />}
        />
      </div>

      {isBonus ? (
        <img
          src="/menu/on-boarding/menu-bonus-assets.png"
          alt=""
          aria-hidden="true"
          className="w-full object-contain opacity-50"
        />
      ) : (
        <img
          src={step.image || '/menu/on-boarding/menu-lobby-assets.png'}
          alt=""
          aria-hidden="true"
          className={`w-full object-contain transition-opacity ${hasCustomImage ? customImageOpacity : lobbyOpacity}`}
        />
      )}
    </div>
  )
}

function BottomNavigation({ step, stepIndex, stepsLength, onPrevious, onNext }) {
  const isLastStep = stepIndex === stepsLength - 1
  const [currentIndex, totalSteps] = step.index.split('/')
  const navIcon = step.navIcon || (step.id === 'lobby' || step.id === 'bonus' ? step.id : null)

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex h-13 items-center justify-between bg-red-primary px-8 text-light">
      <button
        type="button"
        aria-label="Étape précédente"
        onClick={onPrevious}
        disabled={stepIndex === 0}
        className={`flex h-full items-center transition active:scale-95 ${stepIndex === 0 ? 'opacity-30' : ''}`}
      >
        <img src="/menu/on-boarding/previous.svg" alt="" aria-hidden="true" className="h-7 w-12 object-contain" />
      </button>

      <div className="flex h-full items-center gap-2 font-funnel text-sm font-bold">
        <span>
          {currentIndex}
          <span className="opacity-50">/{totalSteps}</span>
        </span>
        {navIcon && (
          <MenuColorIcon src={navIcon === 'lobby' ? '/menu/icon/crown.svg' : '/menu/icon/bonus.svg'} className="h-4 w-4" />
        )}
        <span>{step.label}</span>
      </div>

      <button
        type="button"
        aria-label={isLastStep ? "Terminer l'onboarding" : 'Étape suivante'}
        onClick={onNext}
        className="flex h-full items-center transition active:scale-95"
      >
        {isLastStep ? (
          <img src="/menu/on-boarding/close.svg" alt="" aria-hidden="true" className="h-9 w-9 object-contain" />
        ) : (
          <img src="/menu/on-boarding/next.svg" alt="" aria-hidden="true" className="h-7 w-12 object-contain" />
        )}
      </button>
    </div>
  )
}

export default function MenuOnboarding({ variant = 'player', onClose, onDone }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [panelHeight, setPanelHeight] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const panelContentRef = useRef(null)
  const steps = getOnboardingSteps(variant)
  const step = steps[stepIndex] || steps[0]

  useEffect(() => {
    setStepIndex(0)
  }, [variant])

  useEffect(() => {
    const panelContent = panelContentRef.current
    if (!panelContent) return undefined

    const syncPanelHeight = () => {
      setPanelHeight(panelContent.offsetHeight + BOTTOM_NAV_HEIGHT)
    }

    const frameId = window.requestAnimationFrame(syncPanelHeight)
    const resizeObserver = new ResizeObserver(syncPanelHeight)
    resizeObserver.observe(panelContent)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
    }
  }, [stepIndex])

  const closeAndMarkDone = () => {
    if (isClosing) return
    onDone?.()
    setIsClosing(true)
    window.setTimeout(() => {
      onClose?.()
    }, 250)
  }

  const goPrevious = () => {
    setStepIndex((current) => Math.max(0, current - 1))
  }

  const goNext = () => {
    if (stepIndex >= steps.length - 1) {
      closeAndMarkDone()
      return
    }
    setStepIndex((current) => current + 1)
  }

  return (
    <>
      <style>{`
        @keyframes settingsSlideUpFromBottom {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes settingsSlideDownToBottom {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        .menu-onboarding-enter {
          animation: settingsSlideUpFromBottom 0.25s ease-out;
        }
        .menu-onboarding-exit {
          animation: settingsSlideDownToBottom 0.25s ease-in forwards;
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs pointer-events-auto"
        data-no-longpress
      >
        <div
          className="relative w-full max-w-full transition-[height] duration-300 ease-out"
          style={panelHeight ? { height: `${panelHeight}px` } : undefined}
        >
          <div
            className={`absolute inset-x-0 bottom-0 bg-bg text-light transition-[height] duration-300 ease-out ${
              isClosing ? 'menu-onboarding-exit' : 'menu-onboarding-enter'
            }`}
            style={panelHeight ? { height: `${panelHeight}px` } : undefined}
          >
            <div
 className="pointer-events-none absolute -top-2 left-0 h-full w-full"
              style={{
                WebkitMaskImage: 'url(/menu/menu-border-top.svg)',
                maskImage: 'url(/menu/menu-border-top.svg)',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: 'top center',
                maskPosition: 'top center',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                backgroundColor: '#282726'
              }}
            />

            <div className="absolute right-6 -top-5 z-10 flex items-center gap-2">
              <FakeIconButton type="rules" label="Règles" active={step.spotlight === 'rules'} />
              <FakeIconButton type="fullscreen" label="Plein écran" active={step.spotlight === 'fullscreen'} />
              <FakeIconButton type="close" label="Fermer le menu" active={step.spotlight === 'close'} />
            </div>

            <div ref={panelContentRef} className="relative flex flex-col gap-7 px-6 pt-12 pb-6">
              <Callout step={step} />
              <ContentPreview step={step} />
            </div>
            <BottomNavigation
              step={step}
              stepIndex={stepIndex}
              stepsLength={steps.length}
              onPrevious={goPrevious}
              onNext={goNext}
            />
          </div>
        </div>
      </div>
    </>
  )
}
