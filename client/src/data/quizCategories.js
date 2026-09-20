const QUIZ_CATEGORY_IDS = {
  'Culture graphique': 'culture',
  'Signe et couleur': 'couleur',
  'Typographie': 'typo',
  Logo: 'logo',
  Composition: 'compo',
  Production: 'prod'
}

export const getQuizCategoryId = (categoryName) => {
  if (!categoryName) return ''
  return QUIZ_CATEGORY_IDS[categoryName] || String(categoryName).toLowerCase()
}
