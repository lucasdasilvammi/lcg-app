const SESSION_TOKEN_KEY = 'lcg_session_token'
export const CAMERA_IMAGE_SIZE = 1280
const CAMERA_IMAGE_QUALITY = 0.75

export const getPhotoDraftKey = (roomId, brandName) => {
  if (typeof window === 'undefined' || !roomId) return null
  const sessionToken = window.localStorage.getItem(SESSION_TOKEN_KEY)
  if (!sessionToken) return null
  return `lcg_activite_photo_draft:${roomId}:${sessionToken}:${brandName || 'logo'}`
}

export const readPhotoDraft = (key) => {
  if (typeof window === 'undefined' || !key) return null
  try {
    return window.sessionStorage.getItem(key) || window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export const writePhotoDraft = (key, value) => {
  if (typeof window === 'undefined' || !key) return
  try {
    if (value) {
      window.sessionStorage.setItem(key, value)
      window.localStorage.setItem(key, value)
    } else {
      window.sessionStorage.removeItem(key)
      window.localStorage.removeItem(key)
    }
  } catch {
    // Mobile browsers can reject storage writes when memory is tight.
  }
}

export const canUseIntegratedCamera = () => (
  typeof window !== 'undefined'
  && window.isSecureContext
  && typeof navigator !== 'undefined'
  && Boolean(navigator.mediaDevices?.getUserMedia)
)

export const stopStream = (stream) => {
  stream?.getTracks?.().forEach((track) => track.stop())
}

export const getCameraIssue = (error) => {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return {
      type: 'permission',
      message: "L'accès à la caméra est bloqué. Autorise-la, puis réessaie."
    }
  }
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
    return {
      type: 'unavailable',
      message: "Aucune caméra utilisable n'a été trouvée sur cet appareil. Importe une image pour continuer."
    }
  }
  if (error?.name === 'NotReadableError') {
    return {
      type: 'busy',
      message: "La caméra est déjà utilisée ou inaccessible. Ferme les autres applications caméra, réessaie, ou importe une image."
    }
  }
  return {
    type: 'failed',
    message: "Impossible d'ouvrir la caméra. Réessaie ou importe une image pour continuer."
  }
}

export const videoFrameToDataUrl = (video) => {
  const videoWidth = video.videoWidth
  const videoHeight = video.videoHeight
  if (!videoWidth || !videoHeight) throw new Error('Caméra pas encore prête.')

  const sourceSize = Math.min(videoWidth, videoHeight)
  const sourceX = Math.max(0, Math.floor((videoWidth - sourceSize) / 2))
  const sourceY = Math.max(0, Math.floor((videoHeight - sourceSize) / 2))
  const canvas = document.createElement('canvas')
  canvas.width = CAMERA_IMAGE_SIZE
  canvas.height = CAMERA_IMAGE_SIZE

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas indisponible.')

  context.drawImage(
    video,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    CAMERA_IMAGE_SIZE,
    CAMERA_IMAGE_SIZE
  )
  return canvas.toDataURL('image/jpeg', CAMERA_IMAGE_QUALITY)
}

export const fileToResizedDataUrl = (file) => new Promise((resolve, reject) => {
  const image = new Image()
  const reader = new FileReader()

  reader.onerror = () => reject(new Error("Impossible de lire l'image."))
  reader.onload = () => {
    image.onload = () => {
      const width = image.naturalWidth || image.width
      const height = image.naturalHeight || image.height
      if (!width || !height) {
        reject(new Error('Image invalide.'))
        return
      }

      const scale = Math.min(1, CAMERA_IMAGE_SIZE / Math.max(width, height))
      const targetWidth = Math.max(1, Math.round(width * scale))
      const targetHeight = Math.max(1, Math.round(height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Canvas indisponible.'))
        return
      }

      context.drawImage(image, 0, 0, targetWidth, targetHeight)
      resolve(canvas.toDataURL('image/jpeg', CAMERA_IMAGE_QUALITY))
    }
    image.onerror = () => reject(new Error("Impossible de décoder l'image."))
    image.src = reader.result
  }
  reader.readAsDataURL(file)
})
