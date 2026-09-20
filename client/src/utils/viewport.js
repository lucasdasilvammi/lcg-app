export const isMobileViewport = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 470 || /iPhone|iPad|Android|Mobile/.test(navigator.userAgent)
}
