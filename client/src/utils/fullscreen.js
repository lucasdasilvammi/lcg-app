export const isIosDevice = () => {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export const isStandaloneApp = () => {
  if (typeof window === 'undefined') return false
  return Boolean(
    window.navigator?.standalone
    || window.matchMedia?.('(display-mode: standalone)').matches
    || window.matchMedia?.('(display-mode: fullscreen)').matches
  )
}

export const isFullscreenActive = () => {
  if (typeof document === 'undefined') return false
  return Boolean(
    document.fullscreenElement
    || document.webkitFullscreenElement
    || isStandaloneApp()
  )
}

const notifyFullscreenUnavailable = ({ source, reason }) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('lcg:fullscreen-unavailable', {
    detail: { source, reason }
  }))
}

export const requestAppFullscreen = async ({ source = 'unknown', notifyUnavailable = true } = {}) => {
  if (typeof document === 'undefined') return false
  if (isFullscreenActive()) return true

  const element = document.documentElement
  const request = element.requestFullscreen || element.webkitRequestFullscreen
  const fullscreenEnabled = document.fullscreenEnabled ?? document.webkitFullscreenEnabled ?? true

  if (!request || !fullscreenEnabled) {
    console.warn('fullscreen unavailable', { source, fullscreenEnabled })
    if (isIosDevice() && notifyUnavailable) {
      window.scrollTo?.(0, 0)
      window.setTimeout?.(() => window.scrollTo?.(0, 1), 50)
    }
    if (notifyUnavailable) {
      notifyFullscreenUnavailable({
        source,
        reason: isIosDevice() ? 'ios-standalone-required' : 'api-unavailable'
      })
    }
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
    if (notifyUnavailable) {
      notifyFullscreenUnavailable({
        source,
        reason: isIosDevice() ? 'ios-standalone-required' : 'request-failed'
      })
    }
    return false
  }
}
