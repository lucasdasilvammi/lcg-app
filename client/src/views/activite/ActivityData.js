import { formatCharacterName } from '../../utils/frenchGrammar'

export const CHAR_COLORS = {
  alan: '#06C0F9',
  donatien: '#FF37A5',
  lucien: '#20CA4B',
  virginie: '#F63609',
  barbara: '#9D0AFF',
  alex: '#FFC400',
  lucie: '#1C51FF',
  tanguy: '#FF8A04',
}

export const getPlayerCharacter = (player) => player?.character || player?.charId || 'alan'
export const getCharacterColor = (charId) => CHAR_COLORS[charId] || '#FFF6EF'
export const getCharacterName = (charId) => formatCharacterName(charId) || 'Joueur'
export const getBrandMask = (brandName) => '*'.repeat(Array.from(String(brandName || '')).length)
export const getBrandAnswerImage = (brandName) => {
  const slug = String(brandName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return slug ? `/activite/reponses/logo-${slug}.png` : null
}
