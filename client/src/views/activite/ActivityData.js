import { formatCharacterName } from '../../utils/frenchGrammar'
import { getCharacterPrimaryColor } from '../../data/characters'

export const getPlayerCharacter = (player) => player?.character || player?.charId || 'alan'
export const getCharacterColor = getCharacterPrimaryColor
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
