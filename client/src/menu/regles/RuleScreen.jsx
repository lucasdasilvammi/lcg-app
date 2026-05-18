function RulesLogo() {
  return (
    <img
      src="/room/logo.svg"
      alt="Le cube graphique"
      className="h-12 w-auto object-contain"
    />
  )
}

function RulesIconButton({ label, icon, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center text-bg transition active:scale-95"
    >
      <img src={icon} alt="" aria-hidden="true" className="h-full w-full object-contain" />
    </button>
  )
}

export default function RuleScreen({ children, onClose, borderColor = 'var(--color-light5)' }) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/70 backdrop-blur-xs"
      data-no-longpress
    >
      <section
        className="relative flex h-[var(--app-height,100dvh)] w-full max-w-110 overflow-hidden bg-bg text-light"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundColor: borderColor,
            WebkitMaskImage: 'url(/assets/home-border-verical.svg)',
            maskImage: 'url(/assets/home-border-verical.svg)',
            WebkitMaskSize: 'auto 100%',
            maskSize: 'auto 100%',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat'
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundColor: borderColor,
            WebkitMaskImage: 'url(/assets/home-border-horizontal.svg)',
            maskImage: 'url(/assets/home-border-horizontal.svg)',
            WebkitMaskSize: '100% auto',
            maskSize: '100% auto',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat'
          }}
        />
        <div className="relative z-10 flex min-h-0 w-full flex-col px-10 py-12">
          <header className="flex items-start justify-between gap-5">
            <RulesLogo />
            <RulesIconButton label="Fermer les règles" icon="/menu/close.svg" onClick={onClose} />
          </header>
          {children}
        </div>
      </section>
    </div>
  )
}
