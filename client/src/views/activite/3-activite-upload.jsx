import React, { useEffect, useRef, useState } from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import {
  ActivityScreen,
  ActivityHeaderTag,
  CutPanel,
  MaskAssetIcon,
  PhotoFrame,
  StatusTag
} from './ActivityShared'

const SESSION_TOKEN_KEY = 'lcg_session_token'
const CAMERA_IMAGE_SIZE = 1280
const CAMERA_IMAGE_QUALITY = 0.75

const getPhotoDraftKey = (roomId, brandName) => {
  if (typeof window === 'undefined' || !roomId) return null
  const sessionToken = window.localStorage.getItem(SESSION_TOKEN_KEY)
  if (!sessionToken) return null
  return `lcg_activite_photo_draft:${roomId}:${sessionToken}:${brandName || 'logo'}`
}

const readPhotoDraft = (key) => {
  if (typeof window === 'undefined' || !key) return null
  try {
    return window.sessionStorage.getItem(key) || window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const writePhotoDraft = (key, value) => {
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

const canUseIntegratedCamera = () => (
  typeof window !== 'undefined'
  && window.isSecureContext
  && typeof navigator !== 'undefined'
  && Boolean(navigator.mediaDevices?.getUserMedia)
)

const stopStream = (stream) => {
  stream?.getTracks?.().forEach((track) => track.stop())
}

const isMobileViewport = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 470 || /iPhone|iPad|Android|Mobile/.test(navigator.userAgent)
}

const requestMobileFullscreen = () => {
  if (!isMobileViewport()) return
  if (typeof document === 'undefined') return
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return
  document.documentElement.requestFullscreen().catch(() => {})
}

export default function ActiviteUpload({ roomData, currentUserId, submitPhoto }) {
  const interaction = roomData?.currentInteraction || {}
  const { uploadedPhotos = {}, participants = [], brandName = '' } = interaction
  const draftKey = getPhotoDraftKey(roomData?.id, brandName)
  const [photoPreview, setPhotoPreview] = useState(() => readPhotoDraft(draftKey))
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [cameraMode, setCameraMode] = useState('idle')
  const [cameraFacingMode, setCameraFacingMode] = useState('environment')
  const [isVideoReady, setIsVideoReady] = useState(false)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const loadedDraftKeysRef = useRef(new Set())
  const shouldRestoreFullscreenRef = useRef(false)
  const hasUploaded = Boolean(uploadedPhotos[currentUserId])
  const uploadedCount = Object.keys(uploadedPhotos).filter(id => participants.includes(id)).length
  const totalCount = participants.length
  const isCameraOpen = cameraMode === 'opening' || cameraMode === 'ready'

  const closeIntegratedCamera = ({ clearError = true } = {}) => {
    stopStream(cameraStreamRef.current)
    cameraStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setIsVideoReady(false)
    setCameraMode('idle')
    if (clearError) setUploadError(null)
  }

  useEffect(() => {
    if (!draftKey || loadedDraftKeysRef.current.has(draftKey)) return
    loadedDraftKeysRef.current.add(draftKey)

    const draft = readPhotoDraft(draftKey)
    if (draft && !photoPreview && !hasUploaded) {
      setPhotoPreview(draft)
    }
  }, [draftKey, hasUploaded, photoPreview])

  useEffect(() => {
    if (hasUploaded) {
      writePhotoDraft(draftKey, null)
    }
  }, [draftKey, hasUploaded])

  useEffect(() => () => {
    stopStream(cameraStreamRef.current)
    cameraStreamRef.current = null
  }, [])

  useEffect(() => {
    const restoreFullscreenAfterPicker = () => {
      if (!shouldRestoreFullscreenRef.current) return
      shouldRestoreFullscreenRef.current = false
      window.setTimeout(requestMobileFullscreen, 120)
    }

    window.addEventListener('focus', restoreFullscreenAfterPicker)
    document.addEventListener('visibilitychange', restoreFullscreenAfterPicker)
    return () => {
      window.removeEventListener('focus', restoreFullscreenAfterPicker)
      document.removeEventListener('visibilitychange', restoreFullscreenAfterPicker)
    }
  }, [])

  useEffect(() => {
    if (photoPreview || hasUploaded) {
      closeIntegratedCamera({ clearError: false })
    }
  }, [photoPreview, hasUploaded])

  const fileToResizedDataUrl = (file, { maxSize = 1280, quality = 0.75 } = {}) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()

      reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'))
      reader.onload = () => {
        img.onload = () => {
          const w = img.naturalWidth || img.width
          const h = img.naturalHeight || img.height
          if (!w || !h) return reject(new Error('Image invalide.'))

          const scale = Math.min(1, maxSize / Math.max(w, h))
          const targetW = Math.max(1, Math.round(w * scale))
          const targetH = Math.max(1, Math.round(h * scale))
          const canvas = document.createElement('canvas')
          canvas.width = targetW
          canvas.height = targetH

          const ctx = canvas.getContext('2d')
          if (!ctx) return reject(new Error('Canvas indisponible.'))
          ctx.drawImage(img, 0, 0, targetW, targetH)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }

        img.onerror = () => reject(new Error("Impossible de décoder l'image."))
        img.src = reader.result
      }

      reader.readAsDataURL(file)
    })
  }

  const videoFrameToDataUrl = (video, { maxSize = CAMERA_IMAGE_SIZE, quality = CAMERA_IMAGE_QUALITY } = {}) => {
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight
    if (!videoWidth || !videoHeight) throw new Error('Caméra pas encore prête.')

    const sourceSize = Math.min(videoWidth, videoHeight)
    const sourceX = Math.max(0, Math.floor((videoWidth - sourceSize) / 2))
    const sourceY = Math.max(0, Math.floor((videoHeight - sourceSize) / 2))
    const canvas = document.createElement('canvas')
    canvas.width = maxSize
    canvas.height = maxSize

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponible.')

    if (cameraFacingMode === 'user') {
      ctx.translate(maxSize, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, sourceX, sourceY, sourceSize, sourceSize, 0, 0, maxSize, maxSize)
    return canvas.toDataURL('image/jpeg', quality)
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    requestMobileFullscreen()
    if (!file) return

    setUploadError(null)
    setIsUploading(true)
    try {
      const resized = await fileToResizedDataUrl(file)
      writePhotoDraft(draftKey, resized)
      setPhotoPreview(resized)
    } catch (err) {
      console.error(err)
      setUploadError(err?.message || 'Erreur lors du traitement de la photo.')
      setPhotoPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleOpenFilePicker = async () => {
    setUploadError(null)
    const shouldRestoreFullscreen = isMobileViewport()
    shouldRestoreFullscreenRef.current = shouldRestoreFullscreen
    if (shouldRestoreFullscreen && typeof document !== 'undefined' && document.fullscreenElement) {
      await document.exitFullscreen?.().catch(() => {})
    }
    window.setTimeout(() => fileInputRef.current?.click(), 50)
  }

  const openIntegratedCamera = async (nextFacingMode = cameraFacingMode) => {
    if (!canUseIntegratedCamera()) {
      closeIntegratedCamera({ clearError: false })
      handleOpenFilePicker()
      return
    }

    setUploadError(null)
    setIsVideoReady(false)
    setCameraMode('opening')
    stopStream(cameraStreamRef.current)
    cameraStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null

    await new Promise((resolve) => window.setTimeout(resolve, 0))

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextFacingMode },
          width: { ideal: CAMERA_IMAGE_SIZE },
          height: { ideal: CAMERA_IMAGE_SIZE },
          aspectRatio: { ideal: 1 }
        },
        audio: false
      })

      cameraStreamRef.current = stream
      setCameraFacingMode(nextFacingMode)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }

      setCameraMode('ready')
    } catch (error) {
      console.error(error)
      stopStream(cameraStreamRef.current)
      cameraStreamRef.current = null
      setCameraMode('idle')
      setIsVideoReady(false)
      handleOpenFilePicker()
    }
  }

  const handleOpenCamera = () => {
    if (!canUseIntegratedCamera()) {
      handleOpenFilePicker()
      return
    }
    openIntegratedCamera('environment')
  }

  const handleSwitchCamera = () => {
    const nextFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment'
    openIntegratedCamera(nextFacingMode)
  }

  const handleCapturePhoto = () => {
    if (!videoRef.current || cameraMode !== 'ready' || !isVideoReady) {
      setUploadError('La caméra se prépare encore.')
      return
    }

    try {
      const captured = videoFrameToDataUrl(videoRef.current)
      writePhotoDraft(draftKey, captured)
      setPhotoPreview(captured)
      closeIntegratedCamera({ clearError: true })
    } catch (error) {
      console.error(error)
      setUploadError(error?.message || 'Impossible de capturer la photo.')
    }
  }

  const handleDeletePhoto = () => {
    setUploadError(null)
    setPhotoPreview(null)
    setIsUploading(false)
    closeIntegratedCamera({ clearError: false })
    writePhotoDraft(draftKey, null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadPhoto = (photoData) => {
    if (!photoData || hasUploaded) return
    setIsUploading(true)
    setUploadError(null)
    submitPhoto(photoData, (response) => {
      setIsUploading(false)
      if (response?.ok) {
        writePhotoDraft(draftKey, null)
        return
      }
      setUploadError(response?.reason || 'Envoi échoué. Réessaie.')
    })
  }

  const handleSubmit = () => {
    uploadPhoto(photoPreview)
  }

  const title = photoPreview ? 'Votre photo' : isCameraOpen ? 'Cadrez votre dessin' : 'Prenez en photo votre dessin'

  if (!roomData || !roomData.currentInteraction) return null

  return (
    <ActivityScreen className="justify-between gap-6">
      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-6">
        <ActivityHeaderTag />

        <div className="flex flex-col items-center gap-3">
          <h1 className="m-0 max-w-72 font-hakobi text-[42px] uppercase leading-none text-light">
            {title}
          </h1>
          <p className="font-funnel text-lg leading-snug text-light/65">
            {photoPreview ? 'Ne la montrez pas aux autres !' : 'Prenez une photo claire de votre dessin. Ne la montrez pas aux autres !'}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
          {photoPreview ? (
            <div className="relative w-full max-w-72">
              <PhotoFrame src={photoPreview} alt="Aperçu du dessin" className="aspect-square w-full" imageClassName="object-cover" />
            </div>
          ) : isCameraOpen ? (
            <div className="flex w-full flex-col items-center gap-3">
              <CutPanel className="relative aspect-square w-full max-w-72 overflow-hidden bg-light5">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  onLoadedMetadata={() => setIsVideoReady(true)}
                  className={`h-full w-full object-cover ${cameraFacingMode === 'user' ? '-scale-x-100' : ''}`}
                />
                {(cameraMode === 'opening' || !isVideoReady) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-bg/70 px-8 text-center font-funnel text-base font-medium text-light">
                    Ouverture de la caméra...
                  </div>
                )}
              </CutPanel>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <CameraActionButton onClick={handleSwitchCamera} disabled={cameraMode === 'opening'}>
                  Changer
                </CameraActionButton>
                <CameraActionButton onClick={() => closeIntegratedCamera()}>
                  Fermer
                </CameraActionButton>
                <CameraActionButton onClick={handleOpenFilePicker}>
                  Importer
                </CameraActionButton>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="flex h-[17.5rem] w-full max-w-72 cursor-pointer flex-col items-center justify-center bg-contain bg-center bg-no-repeat px-8 text-center transition active:scale-95"
              style={{ backgroundImage: 'url(/activite/bg-btn-big.svg)' }}
              onClick={handleOpenCamera}
            >
              <img src="/activite/camera.svg" alt="" aria-hidden="true" className="h-16 w-16 object-contain" />
              <p className="font-funnel text-2xl font-medium leading-tight text-light">
                Appuyez pour ouvrir la caméra
              </p>
              <p className="mt-1 font-funnel text-base text-light/60">
                Prenez votre logo en photo
              </p>
            </button>
          )}

          {uploadError && (
            <div className="flex max-w-72 flex-col items-center gap-2">
              <p className="font-funnel text-sm font-semibold text-red-primary">{uploadError}</p>
              {!isCameraOpen && (
                <button
                  type="button"
                  onClick={handleOpenFilePicker}
                  className="font-funnel text-sm font-semibold text-light underline decoration-light/50 underline-offset-4"
                >
                  Importer une photo
                </button>
              )}
            </div>
          )}
        </div>

        {photoPreview && !hasUploaded && (
          <button
            type="button"
            onClick={handleDeletePhoto}
            aria-label="Supprimer la photo"
            className="relative inline-flex h-8 items-center justify-center gap-1.5 bg-light px-3 py-1 text-bg transition active:scale-95"
          >
            <svg width="35" height="44" viewBox="0 0 35 44" fill="none" className="absolute -left-1 -top-0.25 h-8.5" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M34.4928 0H0V31.6242V44H13.9715L2.82622 40.5735L0 31.6242L2.82624 6.96089L34.4928 0Z" fill="#101010" />
            </svg>
            <span className="relative z-10 flex min-w-max items-center gap-1.5">
              <MaskAssetIcon src="/activite/bin.svg" className="h-4 w-4" />
              <span className="font-funnel text-base font-medium leading-none">Supprimer</span>
            </span>
            <svg width="27" height="44" viewBox="0 0 27 44" fill="none" className="absolute -right-1 -top-0.25 h-8.5" aria-hidden="true">
              <path d="M22.8791 35.1861L26.4677 10.636L22.8791 1.95051L0 0H26.4677V10.636V44H5.35772L18.3731 40.6657L22.8791 35.1861Z" fill="#101010" />
            </svg>
          </button>
        )}

        <StatusTag
          tone={hasUploaded ? 'green' : uploadedCount > 0 ? 'yellow' : 'red'}
          icon={<MaskAssetIcon src="/activite/photo.svg" className="h-4 w-4" />}
        >
          {uploadedCount}/{totalCount} Photos envoyées
        </StatusTag>
      </div>

      <div className="flex w-full justify-center pb-1">
        <ButtonWithIcon
          onClick={photoPreview ? handleSubmit : isCameraOpen ? handleCapturePhoto : handleOpenCamera}
          text={hasUploaded ? 'En attente' : photoPreview ? 'Valider la photo' : isCameraOpen ? 'Prendre la photo' : 'Ouvrir la caméra'}
          disabled={isUploading || hasUploaded || (isCameraOpen && (cameraMode === 'opening' || !isVideoReady))}
          className="w-fit whitespace-nowrap"
        />
      </div>
    </ActivityScreen>
  )
}

function CameraActionButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative inline-flex h-8 items-center justify-center bg-light5 px-3 py-1 text-light transition active:scale-95 disabled:opacity-40"
    >
      <svg width="35" height="44" viewBox="0 0 35 44" fill="none" className="absolute -left-1 -top-0.25 h-8.5" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M34.4928 0H0V31.6242V44H13.9715L2.82622 40.5735L0 31.6242L2.82624 6.96089L34.4928 0Z" fill="#101010" />
      </svg>
      <span className="relative z-10 whitespace-nowrap font-funnel text-sm font-medium leading-none">
        {children}
      </span>
      <svg width="27" height="44" viewBox="0 0 27 44" fill="none" className="absolute -right-1 -top-0.25 h-8.5" aria-hidden="true">
        <path d="M22.8791 35.1861L26.4677 10.636L22.8791 1.95051L0 0H26.4677V10.636V44H5.35772L18.3731 40.6657L22.8791 35.1861Z" fill="#101010" />
      </svg>
    </button>
  )
}
