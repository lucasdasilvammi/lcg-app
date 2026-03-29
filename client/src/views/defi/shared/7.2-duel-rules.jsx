import React from 'react'
import ButtonWithIcon from '../../../components/ButtonWithIcon'
import CharacterTag from '../../../components/CharacterTag'
import DuelNavbar from './DuelNavbar'

export default function DuelRules({ roomData, currentUserId, acknowledgeRules }) {
  if (!roomData || !roomData.currentInteraction) return null
  
  const { type, duelists, readerId } = roomData.currentInteraction
  const duelPlayers = roomData.players.filter(p => duelists.includes(p.id))
  const readerPlayer = roomData.players.find(p => p.id === readerId)
  
  const getRulesContent = () => {
    switch(type) {
      case 'buzzer':
        return {
          title: 'DÉFI BUZZER',
          rules: [
            'Le défi Buzzer est une épreuve de rapidité.',
            'Le premier à répondre juste : gagne le défi, remporte 3 jalons.',
            'Si le premier se trompe : son adversaire remporte les 3 jalons.'
          ],
          hint: 'Vous pouvez buzzer avant la fin de la question, le lecteur doit alors immediatement stopper la lecture.'
        }
      case 'chiffres':
        return {
          title: 'DÉFI CHIFFRES',
          rules: [
            'Le défi Chiffres est une épreuve d’estimation.',
            'Chaque joueur entre une valeur libre.',
            'Le joueur dont la valeur est la plus proche de la bonne réponse gagne le défi et remporte 3 jalons.'
          ],
          hint: null
        }
      case 'pick':
        return {
          title: 'DÉFI PICK',
          rules: [
            'Le défi Pick est une épreuve de perception visuelle.',
            'Les deux joueurs doivent pick la même couleur cible.',
            'À la fin du temps imparti, le joueur dont la couleur est la plus proche de la couleur cible gagne le défi et remporte 3 jalons.',
            'Si l’un des joueurs valide sa couleur avant la fin du chrono, son adversaire n’a plus que 5 secondes pour ajuster sa couleur avant qu’elle soit verrouillée.'
          ],
          hint: null
        }
      default:
        return {
          title: 'DÉFI',
          rules: [
            'Le défi Vrai ou Faux est une épreuve de rapidité et de réactivité.',
            'Le premier à donner la bonne réponse gagne le défi, remporte 3 jalons.',
            'Si le premier se trompe : son adversaire remporte les 3 jalons.'
          ],
          hint: 'Vous pouvez buzzer avant la fin de la question, le lecteur doit alors immediatement stopper la lecture.'
        }
    }
  }
  
  const content = getRulesContent()
  const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1)
  const acknowledged = roomData.currentInteraction?.acknowledgedRules || []
  const totalDuelists = duelists?.length || 2
  const ackCount = acknowledged.filter(id => duelists.includes(id)).length
  const isDuelist = duelists.includes(currentUserId)
  const hasAcknowledged = acknowledged.includes(currentUserId)
  
  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
      <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col items-center justify-between gap-6 py-14 px-6 text-center">
        <div className='flex min-h-0 w-full flex-1 flex-col gap-8 phone:gap-12'>
          <DuelNavbar duelPlayers={duelPlayers} type={type} diff={3} />

          <div className="flex flex-col items-center gap-5 px-4 h-full">
            <h1 className="text-4xl phone:text-5xl font-hakobi uppercase text-light">quelques regles</h1>
            <div className="flex h-full w-full flex-1 flex-col gap-4 text-center">
              {content.rules.map((rule, index) => (
                <p key={index} className="font-funnel text-base phone:text-lg text-light opacity-80">{rule}</p>
              ))}
              {content.hint && (
                <div className="h-full flex items-center gap-3 text-left opacity-70">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 shrink-0 text-light"><path d="M19.2679 1.64258L22.1976 4.05859L26.0834 11.5425L24.7826 17.9775L21.8817 20.3809L20.8099 22.7886L20.7865 23.2388L20.7626 23.6851L22.1351 28.7129L18.8832 29.6816L16.0638 30.0186L15.9754 30.0293H10.993L9.73228 26.8369L10.7127 22.4531L10.5062 22.2031L8.30943 19.5586L6.60728 14.3823L6.59068 14.2231L6.08433 9.42822L10.0965 2.54053L14.6361 1.37744L19.2679 1.64258ZM13.2274 24.9546L12.8612 26.5923L13.0335 27.0293H15.7943L18.2713 26.7334L18.4686 26.6743L17.9374 24.7271L13.2274 24.9546ZM12.057 5.13428L9.17075 10.0898L9.55698 13.7495L10.9818 18.0806L12.8163 20.2886L12.8182 20.291L13.6659 21.3159L14.433 21.3179V19.2012L14.4374 19.0884L14.7826 14.5063L14.7533 14.4976L11.7801 13.4541L11.1338 11.5181L11.3846 10.7334H13.489L15.4683 11.9858H16.636L18.3579 10.4173L20.5687 10.8711L20.7084 11.2803L19.9417 13.1143L18.0209 14.0435L17.8143 14.1919L17.433 19.2617V21.3257L18.1761 21.3276L19.4266 18.519L22.0516 16.3442L22.933 11.9858L19.8167 5.98389L18.1166 4.58154L14.9295 4.39893L12.057 5.13428Z" fill="currentColor"/></svg>
                  <p className="font-funnel text-sm phone:text-base text-light opacity-85 leading-snug">{content.hint}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='flex w-full flex-col gap-5 phone:gap-8'>
          {readerPlayer && <CharacterTag charId={readerPlayer.character} className="mt-0 mb-0 self-center" />}

          <div className="flex w-full flex-col items-center gap-3">
            <p className="font-funnel text-xs phone:text-sm text-light opacity-70 uppercase">Lecture des regles : {ackCount}/{totalDuelists}</p>
            {isDuelist && (
              <ButtonWithIcon
                onClick={hasAcknowledged ? undefined : acknowledgeRules}
                text={hasAcknowledged ? "En attente..." : "Suivant"}
                className={`${hasAcknowledged ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={hasAcknowledged}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
