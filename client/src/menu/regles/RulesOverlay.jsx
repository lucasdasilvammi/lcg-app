import ButtonWithIcon from '../../components/ButtonWithIcon'
import RuleScreen from './RuleScreen'
import MenuReglesPortail from './MenuReglesPortail'
import CestQuoiCeJeu from './steps/01-CestQuoiCeJeu'
import ButDuJeu from './steps/02-ButDuJeu'
import MiseEnPlace from './steps/03-MiseEnPlace'
import CommentOnJoue from './steps/04-CommentOnJoue'
import CaseQuiz from './steps/04-1-CaseQuiz'
import CaseDefi from './steps/04-2-CaseDefi'
import CaseActivite from './steps/04-3-CaseActivite'
import CaseBonus from './steps/04-4-CaseBonus'
import CaseEvenement from './steps/04-5-CaseEvenement'
import OrdreDuJeu from './steps/05-OrdreDuJeu'
import FinDeLaPartie from './steps/06-FinDeLaPartie'
import ConseilsPratiques from './steps/07-ConseilsPratiques'
import ResumeDesPoints from './steps/08-ResumeDesPoints'

const STEPS = [
  'intro',
  'goal',
  'setup',
  'play',
  'quiz',
  'defi',
  'activite',
  'bonus',
  'evenement',
  'order',
  'end',
  'tips',
  'score'
]

const BORDER_COLORS = {
  quiz: 'var(--color-yellow-primary)',
  defi: 'var(--color-blue-primary)',
  activite: 'var(--color-orange-primary)',
  bonus: 'var(--color-green-primary)',
  evenement: 'var(--color-pink-primary)'
}

function MaskIcon({ src, className = 'h-7 w-7' }) {
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

function RuleStepContent({ step }) {
  if (step === 'intro') return <CestQuoiCeJeu />
  if (step === 'goal') return <ButDuJeu />
  if (step === 'setup') return <MiseEnPlace />
  if (step === 'play') return <CommentOnJoue />
  if (step === 'quiz') return <CaseQuiz />
  if (step === 'defi') return <CaseDefi />
  if (step === 'activite') return <CaseActivite />
  if (step === 'bonus') return <CaseBonus />
  if (step === 'evenement') return <CaseEvenement />
  if (step === 'order') return <OrdreDuJeu />
  if (step === 'end') return <FinDeLaPartie />
  if (step === 'tips') return <ConseilsPratiques />
  return <ResumeDesPoints />
}

function RulesIconButton({ label, icon, onClick, disabled = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`relative flex h-13 w-16 items-center justify-center text-bg transition ${
        disabled ? 'cursor-not-allowed opacity-20' : 'active:scale-95'
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-light"
        style={{
          WebkitMaskImage: 'url(/menu/bg-btn.svg)',
          maskImage: 'url(/menu/bg-btn.svg)',
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat'
        }}
      />
      <MaskIcon src={icon} className="relative z-10 h-8 w-8" />
    </button>
  )
}

function RulesActions({ index, onBack, onPrevious, onNext, onFinish }) {
  const hasPrevious = index > 0
  const hasNext = index < STEPS.length - 1
  const isLastStep = index === STEPS.length - 1

  return (
    <div className="flex flex-col items-center gap-3 pt-8">
      {(hasPrevious || hasNext || isLastStep) && (
        <div className="flex items-center justify-center gap-3">
          {hasPrevious && (
            <RulesIconButton
              label="Étape précédente"
              icon="/menu/back.svg"
              onClick={onPrevious}
            />
          )}
          {(hasNext || isLastStep) && (
            <ButtonWithIcon
              text={isLastStep ? 'Terminer' : 'Suivant'}
              onClick={isLastStep ? onFinish : onNext}
              className=""
            />
          )}
        </div>
      )}
      <ButtonWithIcon
        variant="menu"
        text="Retour"
        icon={<MaskIcon src="/menu/icon/enter.svg" />}
        onClick={onBack}
        className="bg-red-secondary text-red-primary"
      />
    </div>
  )
}

function RulesDetail({ step, onClose, onBack, onPrevious, onNext }) {
  const index = STEPS.indexOf(step)

  return (
    <RuleScreen onClose={onClose} borderColor={BORDER_COLORS[step]}>
      <main className="flex min-h-0 flex-1 flex-col pt-10">
        <div className="flex min-h-0 flex-1 flex-col justify-start gap-4">
          <RuleStepContent step={step} />
        </div>
        <RulesActions
          index={index}
          onBack={onBack}
          onPrevious={onPrevious}
          onNext={onNext}
          onFinish={onClose}
        />
      </main>
    </RuleScreen>
  )
}

export default function RulesOverlay({
  currentStep,
  highestUnlockedStepIndex,
  unlockStepIndex,
  onOpenStep,
  onClose
}) {
  if (currentStep === 'portal') {
    return (
      <MenuReglesPortail
        highestUnlockedStepIndex={highestUnlockedStepIndex}
        onOpenStep={onOpenStep}
        onClose={onClose}
      />
    )
  }

  const index = STEPS.indexOf(currentStep)
  const handleBack = () => {
    onOpenStep('portal')
  }
  const handleNext = () => {
    if (index >= STEPS.length - 1) return
    const nextIndex = index + 1
    unlockStepIndex?.(nextIndex)
    onOpenStep(STEPS[nextIndex])
  }
  const handlePrevious = () => {
    if (index <= 0) return
    onOpenStep(STEPS[index - 1])
  }

  return (
    <RulesDetail
      step={currentStep}
      onClose={onClose}
      onBack={handleBack}
      onPrevious={handlePrevious}
      onNext={handleNext}
    />
  )
}
