import React, { useEffect, useRef, useState } from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import { isFullscreenActive, requestAppFullscreen } from '../../utils/fullscreen'
import {
  ActivityHeaderTag,
  ActivityScreen,
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

export default function ActiviteUpload({ roomData, currentUserId, submitPhoto }) {
  const interaction = roomData?.currentInteraction || {}
  const {
    uploadedPhotos = {},
    participants = [],
    photos = [],
    brandName = '',
    participantCount,
    uploadedPhotoCount
  } = interaction
  const draftKey = getPhotoDraftKey(roomData?.id, brandName)
  const [photoPreview, setPhotoPreview] = useState(() => readPhotoDraft(draftKey))
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [cameraMode, setCameraMode] = useState('idle')
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [fullscreenRecoveryNeeded, setFullscreenRecoveryNeeded] = useState(false)
  const videoRef = useRef(null)
  const cameraStreamRef = useRef(null)

  const hasUploaded = photos.some((photo) => photo?.playerId === currentUserId)
    || Boolean(uploadedPhotos[currentUserId])
  const fallbackUploadedCount = new Set(
    photos
      .map((photo) => photo?.playerId)
      .filter((playerId) => participants.includes(playerId))
  ).size
  const uploadedCount = Number.isFinite(uploadedPhotoCount)
    ? uploadedPhotoCount
    : Math.max(
        fallbackUploadedCount,
        Object.keys(uploadedPhotos).filter((playerId) => participants.includes(playerId)).length
      )
  const totalCount = Number.isFinite(participantCount) ? participantCount : participants.length
  const isCameraOpen = cameraMode === 'opening' || cameraMode === 'ready'

  const closeIntegratedCamera = ({ clearError = true } = {}) => {
    stopStream(cameraStreamRef.current)
    cameraStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setIsVideoReady(false)
    setCameraMode('idle')
    if (clearError) setUploadError(null)
  }

  const restoreFullscreen = async (source) => {
    if (!isMobileViewport() || isFullscreenActive()) {
      setFullscreenRecoveryNeeded(false)
      return true
    }

    const restored = await requestAppFullscreen({ source })
    setFullscreenRecoveryNeeded(!restored)
    return restored
  }

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
    const updateFullscreenState = () => {
      if (isFullscreenActive()) {
        setFullscreenRecoveryNeeded(false)
      } else if (isMobileViewport() && (isCameraOpen || photoPreview)) {
        setFullscreenRecoveryNeeded(true)
      }
    }

    updateFullscreenState()
    document.addEventListener('fullscreenchange', updateFullscreenState)
    document.addEventListener('webkitfullscreenchange', updateFullscreenState)
    window.addEventListener('focus', updateFullscreenState)
    window.addEventListener('pageshow', updateFullscreenState)
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState)
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState)
      window.removeEventListener('focus', updateFullscreenState)
      window.removeEventListener('pageshow', updateFullscreenState)
    }
  }, [isCameraOpen, photoPreview])

  const videoFrameToDataUrl = (video) => {
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

  const openIntegratedCamera = async () => {
    if (!canUseIntegratedCamera()) {
      setUploadError("La caméra directe n'est pas disponible sur ce navigateur.")
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
          facingMode: { ideal: 'environment' },
          width: { ideal: CAMERA_IMAGE_SIZE },
          height: { ideal: CAMERA_IMAGE_SIZE },
          aspectRatio: { ideal: 1 }
        },
        audio: false
      })

      cameraStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }

      setCameraMode('ready')
      if (isMobileViewport() && !isFullscreenActive()) {
        setFullscreenRecoveryNeeded(true)
      }
    } catch (error) {
      console.error(error)
      closeIntegratedCamera({ clearError: false })
      setUploadError("Impossible d'ouvrir la caméra arrière. Vérifie son autorisation puis réessaie.")
    }
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
      void restoreFullscreen('activity-photo-captured')
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
    void restoreFullscreen('activity-photo-submit')
    uploadPhoto(photoPreview)
  }

  const title = photoPreview ? 'Votre photo' : isCameraOpen ? 'Cadrez votre dessin' : 'Prenez en photo votre dessin'

  if (!roomData || !roomData.currentInteraction) return null

  return (
    <ActivityScreen scroll compactY className="gap-4">
      <div className="flex w-full flex-col items-center gap-4">
        <ActivityHeaderTag />

        <div className="flex flex-col items-center gap-2">
          <h1 className="m-0 max-w-72 font-hakobi text-[38px] uppercase leading-none text-light">
            {title}
          </h1>
          <p className="max-w-80 font-funnel text-base leading-snug text-light/65">
            {photoPreview ? 'Ne la montrez pas aux autres !' : 'Prenez une photo claire de votre dessin. Ne la montrez pas aux autres !'}
          </p>
        </div>

        {photoPreview ? (
          <div className="relative w-full max-w-64">
            <PhotoFrame src={photoPreview} alt="Aperçu du dessin" className="aspect-square w-full" imageClassName="object-cover" />
          </div>
        ) : isCameraOpen ? (
          <CutPanel className="relative aspect-square w-full max-w-64 overflow-hidden bg-light5">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onLoadedMetadata={() => setIsVideoReady(true)}
              className="h-full w-full object-cover"
            />
            {(cameraMode === 'opening' || !isVideoReady) && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg/70 px-8 text-center font-funnel text-base font-medium text-light">
                Ouverture de la caméra...
              </div>
            )}
          </CutPanel>
        ) : (
          <button
            type="button"
            className="flex h-60 w-full max-w-64 cursor-pointer flex-col items-center justify-center bg-contain bg-center bg-no-repeat px-8 text-center transition active:scale-95"
            style={{ backgroundImage: 'url(/activite/bg-btn-big.svg)' }}
            onClick={openIntegratedCamera}
          >
            <img src="/activite/camera.svg" alt="" aria-hidden="true" className="h-14 w-14 object-contain" />
            <p className="font-funnel text-xl font-medium leading-tight text-light">
              Appuyez pour ouvrir la caméra
            </p>
            <p className="mt-1 font-funnel text-sm text-light/60">
              Caméra arrière uniquement
            </p>
          </button>
        )}

        {uploadError && (
          <div className="flex max-w-72 flex-col items-center gap-2">
            <p className="font-funnel text-sm font-semibold text-red-primary">{uploadError}</p>
            {!isCameraOpen && !photoPreview && (
              <button
                type="button"
                onClick={openIntegratedCamera}
                className="font-funnel text-sm font-semibold text-light underline decoration-light/50 underline-offset-4"
              >
                Réessayer la caméra
              </button>
            )}
          </div>
        )}

        {photoPreview && !hasUploaded && (
          <button
            type="button"
            onClick={handleDeletePhoto}
            aria-label="Supprimer la photo"
            className="relative inline-flex h-8 shrink-0 items-center justify-center gap-1.5 bg-light px-3 py-1 text-bg transition active:scale-95"
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

        {fullscreenRecoveryNeeded && (
          <button
            type="button"
            onClick={() => restoreFullscreen('activity-photo-recovery')}
            className="font-funnel text-sm font-semibold text-orange-primary underline decoration-orange-primary/60 underline-offset-4"
          >
            Repasser en plein écran
          </button>
        )}

        <StatusTag
          tone={hasUploaded ? 'green' : uploadedCount > 0 ? 'yellow' : 'red'}
          icon={<MaskAssetIcon src="/activite/photo.svg" className="h-4 w-4" />}
        >
          {uploadedCount}/{totalCount} Photos envoyées
        </StatusTag>

        <div className="flex w-full justify-center pb-4 pt-1">
          <ButtonWithIcon
            onClick={photoPreview ? handleSubmit : isCameraOpen ? handleCapturePhoto : openIntegratedCamera}
            text={hasUploaded ? 'En attente' : photoPreview ? 'Valider la photo' : isCameraOpen ? 'Prendre la photo' : 'Ouvrir la caméra'}
            disabled={isUploading || hasUploaded || (isCameraOpen && (cameraMode === 'opening' || !isVideoReady))}
            className="w-fit whitespace-nowrap"
          />
        </div>
      </div>
    </ActivityScreen>
  )
}
