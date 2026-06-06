export const isFullscreenActive = () => {
  if (typeof document === 'undefined') return false
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement)
}

export const requestAppFullscreen = async ({ source = 'unknown' } = {}) => {
  if (typeof document === 'undefined') return false
  if (isFullscreenActive()) return true

  const element = document.documentElement
  const request = element.requestFullscreen || element.webkitRequestFullscreen
  const fullscreenEnabled = document.fullscreenEnabled ?? document.webkitFullscreenEnabled ?? true

  if (!request || !fullscreenEnabled) {
    console.warn('fullscreen unavailable', { source, fullscreenEnabled })
    return false
  }

  try {
    if (request === element.requestFullscreen) {
      try {
        await request.call(element, { navigationUI: 'hide' })
      } catch (error) {
        if (error instanceof TypeError) {
          await request.call(element)
        } else {
          throw error
        }
      }
    } else {
      await request.call(element)
    }
    return true
  } catch (error) {
    console.warn('fullscreen request failed', { source, error })
    return false
  }
}
