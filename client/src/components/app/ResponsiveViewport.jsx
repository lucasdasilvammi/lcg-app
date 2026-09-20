import { useLayoutEffect } from 'react'
import { isFullscreenActive } from '../../utils/fullscreen'
import { isMobileViewport } from '../../utils/viewport'

const APP_DESIGN_WIDTH = 390
const FULLSCREEN_SCREEN_PADDING_TOP = '5rem'
const FULLSCREEN_SCREEN_PADDING_BOTTOM = '3.5rem'
const WINDOWED_MOBILE_SCREEN_PADDING_TOP = '1rem'
const WINDOWED_MOBILE_SCREEN_PADDING_BOTTOM = '1.5rem'

export default function ResponsiveViewport({ children }) {
  useLayoutEffect(() => {
    const updateViewportMetrics = () => {
      const viewport = window.visualViewport
      const viewportWidth = viewport?.width || window.innerWidth
      const viewportHeight = viewport?.height || window.innerHeight
      const visualWidth = Math.min(viewportWidth, APP_DESIGN_WIDTH)
      const scale = visualWidth / APP_DESIGN_WIDTH
      const logicalHeight = viewportHeight / scale
      const shouldUseCompactPadding = isMobileViewport() && !isFullscreenActive()

      document.documentElement.style.setProperty('--app-design-width', APP_DESIGN_WIDTH + 'px')
      document.documentElement.style.setProperty('--app-visual-width', Math.round(visualWidth) + 'px')
      document.documentElement.style.setProperty('--app-scale', String(scale))
      document.documentElement.style.setProperty('--app-viewport-height', Math.round(viewportHeight) + 'px')
      document.documentElement.style.setProperty('--app-height', Math.round(logicalHeight) + 'px')
      document.documentElement.style.setProperty(
        '--app-screen-padding-top',
        shouldUseCompactPadding ? WINDOWED_MOBILE_SCREEN_PADDING_TOP : FULLSCREEN_SCREEN_PADDING_TOP
      )
      document.documentElement.style.setProperty(
        '--app-screen-padding-bottom',
        shouldUseCompactPadding ? WINDOWED_MOBILE_SCREEN_PADDING_BOTTOM : FULLSCREEN_SCREEN_PADDING_BOTTOM
      )
    }

    updateViewportMetrics()
    window.addEventListener('resize', updateViewportMetrics)
    window.addEventListener('orientationchange', updateViewportMetrics)
    window.visualViewport?.addEventListener('resize', updateViewportMetrics)
    window.visualViewport?.addEventListener('scroll', updateViewportMetrics)
    document.addEventListener('fullscreenchange', updateViewportMetrics)
    document.addEventListener('webkitfullscreenchange', updateViewportMetrics)

    return () => {
      window.removeEventListener('resize', updateViewportMetrics)
      window.removeEventListener('orientationchange', updateViewportMetrics)
      window.visualViewport?.removeEventListener('resize', updateViewportMetrics)
      window.visualViewport?.removeEventListener('scroll', updateViewportMetrics)
      document.removeEventListener('fullscreenchange', updateViewportMetrics)
      document.removeEventListener('webkitfullscreenchange', updateViewportMetrics)
    }
  }, [])

  return (
    <div className="app-viewport">
      <div className="app-stage">
        <div className="app-stage-content">
          {children}
        </div>
      </div>
    </div>
  )
}
