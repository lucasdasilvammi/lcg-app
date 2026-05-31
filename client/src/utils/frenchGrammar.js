const CHARACTER_GENDERS = {
  donatien: 'm',
  tanguy: 'm',
  alan: 'm',
  lucien: 'm',
  virginie: 'f',
  lucie: 'f',
  barbara: 'f',
  alex: 'f'
}

const VOWEL_SOUND_RE = /^[aeiouyàâäéèêëîïôöùûü]/i

export function normalizeCharacterId(character) {
  return String(character || '').trim().toLowerCase()
}

export function formatCharacterName(character) {
  const name = String(character || '').trim()
  return name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : ''
}

export function getCharacterGender(character) {
  return CHARACTER_GENDERS[normalizeCharacterId(character)] || 'm'
}

export function isFeminineCharacter(character) {
  return getCharacterGender(character) === 'f'
}

export function startsWithVowelSound(character) {
  return VOWEL_SOUND_RE.test(formatCharacterName(character))
}

export function agree(character, masculine, feminine) {
  return isFeminineCharacter(character) ? feminine : masculine
}

export function pronoun(character, { capitalize = false } = {}) {
  const value = agree(character, 'il', 'elle')
  return capitalize ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value
}

export function tonicPronoun(character) {
  return agree(character, 'lui', 'elle')
}

export function definiteArticle(character, { capitalize = false } = {}) {
  const value = startsWithVowelSound(character) ? "l'" : agree(character, 'le', 'la')
  return capitalize && !value.endsWith("'")
    ? `${value.charAt(0).toUpperCase()}${value.slice(1)}`
    : value
}

export function deCharacter(character) {
  const name = formatCharacterName(character)
  if (!name) return ''
  return `${startsWithVowelSound(name) ? "d'" : 'de '}${name}`
}

export function queCharacter(character) {
  const name = formatCharacterName(character)
  if (!name) return ''
  return `${startsWithVowelSound(name) ? "qu'" : 'que '}${name}`
}

export function labelBeforeCharacter(prefix, character) {
  const name = formatCharacterName(character)
  const trimmedPrefix = String(prefix || '').trim()
  if (!name) return trimmedPrefix
  if (!trimmedPrefix) return name
  if (/\bde$/i.test(trimmedPrefix)) return `${trimmedPrefix.replace(/\bde$/i, startsWithVowelSound(name) ? "d'" : 'de ')}${name}`
  if (/\bque$/i.test(trimmedPrefix)) return `${trimmedPrefix.replace(/\bque$/i, startsWithVowelSound(name) ? "qu'" : 'que ')}${name}`
  return `${trimmedPrefix} ${name}`
}
