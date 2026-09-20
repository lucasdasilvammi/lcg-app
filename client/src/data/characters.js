import characters from '../../../shared/characters.json'

export const PLAYABLE_CHARACTERS = characters

export const CODE_CHARACTERS = characters
  .filter((character) => Number.isInteger(character.codeIndex))
  .sort((left, right) => left.codeIndex - right.codeIndex)
  .map((character) => ({
    id: character.codeIndex,
    name: character.name
  }))

const CHARACTERS_BY_ID = new Map(
  characters.map((character) => [character.id, character])
)

export const getCharacter = (characterId) => CHARACTERS_BY_ID.get(characterId) || null

export const getCharacterPrimaryColor = (characterId) => (
  getCharacter(characterId)?.primaryColor || '#FFF6EF'
)

export const getCharacterSecondaryColor = (characterId) => (
  getCharacter(characterId)?.secondaryColor || '#101010'
)

export const getCharacterSecondaryCssColor = (characterId) => {
  const cssVar = getCharacter(characterId)?.secondaryCssVar
  return cssVar ? 'var(' + cssVar + ')' : 'var(--color-light5)'
}
