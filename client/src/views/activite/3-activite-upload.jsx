import React, { useEffect, useRef, useState } from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import { isFullscreenActive, requestAppFullscreen } from '../../utils/fullscreen'
import { isMobileViewport } from '../../utils/viewport'
import {
  ActivityHeaderTag,
  ActivityScreen,
  CutPanel,
  MaskAssetIcon,
  PhotoFrame,
  StatusTag
} from './ActivityShared'
import {
  CAMERA_IMAGE_SIZE,
  canUseIntegratedCamera,
  fileToResizedDataUrl,
  getCameraIssue,
  getPhotoDraftKey,
  readPhotoDraft,
  stopStream,
  videoFrameToDataUrl,
  writePhotoDraft
} from './activityPhoto'

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
  const [cameraIssue, setCameraIssue] = useState(null)
  const [cameraMode, setCameraMode] = useState('idle')
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [fullscreenRecoveryNeeded, setFullscreenRecoveryNeeded] = useState(false)
  const fileInputRef = useRef(null)
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

  const restoreFullscreen = async (source, { notifyUnavailable = true } = {}) => {
    if (!isMobileViewport() || isFullscreenActive()) {
      setFullscreenRecoveryNeeded(false)
      return true
    }

    const restored = await requestAppFullscreen({ source, notifyUnavailable })
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

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadError(null)
    setIsUploading(true)
    try {
      const resized = await fileToResizedDataUrl(file)
      writePhotoDraft(draftKey, resized)
      setPhotoPreview(resized)
      setCameraIssue(null)
      void restoreFullscreen('activity-photo-imported', { notifyUnavailable: false })
    } catch (error) {
      console.error(error)
      setUploadError(error?.message || "Impossible d'importer cette image.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleOpenImport = () => {
    fileInputRef.current?.click()
  }

  const openIntegratedCamera = async () => {
    if (!canUseIntegratedCamera()) {
      const issue = {
        type: 'unavailable',
        message: "La caméra directe n'est pas disponible sur cet appareil. Importe une image pour continuer."
      }
      setCameraIssue(issue)
      setUploadError(issue.message)
      return
    }

    setUploadError(null)
    setCameraIssue(null)
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
      const issue = getCameraIssue(error)
      setCameraIssue(issue)
      setUploadError(issue.message)
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
      void restoreFullscreen('activity-photo-captured', { notifyUnavailable: false })
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
    setCameraIssue(null)
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
    void restoreFullscreen('activity-photo-submit', { notifyUnavailable: false })
    uploadPhoto(photoPreview)
  }

  const title = photoPreview ? 'Votre photo' : isCameraOpen ? 'Cadrez votre dessin' : 'Prenez en photo votre dessin'

  if (!roomData || !roomData.currentInteraction) return null

  return (
    <ActivityScreen compactY className="justify-between gap-3">
      <div className="activity-scroll flex min-h-0 w-full flex-1 flex-col items-center gap-4 overflow-y-auto pb-2">
        <ActivityHeaderTag />

        <div className="flex flex-col items-center gap-2">
          <h1 className="m-0 max-w-72 font-hakobi text-[38px] uppercase leading-none text-light">
            {title}
          </h1>
          <p className="max-w-80 font-funnel text-base leading-snug text-light/65">
            {photoPreview ? 'Ne la montrez pas aux autres !' : 'Prenez une photo claire de votre dessin. Ne la montrez pas aux autres !'}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex min-h-60 w-full flex-1 items-center justify-center">
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
                Prends ton logo en photo
              </p>
            </button>
          )}
        </div>

        {uploadError && (
          <div className="flex max-w-72 flex-col items-center gap-2">
            <p className="font-funnel text-sm font-semibold text-red-primary">{uploadError}</p>
            {!isCameraOpen && !photoPreview && (
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {cameraIssue?.type !== 'unavailable' && (
                  <button
                    type="button"
                    onClick={openIntegratedCamera}
                    className="font-funnel text-sm font-semibold text-light underline decoration-light/50 underline-offset-4"
                  >
                    Réessayer
                  </button>
                )}
                {cameraIssue && (
                  <button
                    type="button"
                    onClick={handleOpenImport}
                    className="font-funnel text-sm font-semibold text-orange-primary underline decoration-orange-primary/60 underline-offset-4"
                  >
                    Importer une image
                  </button>
                )}
              </div>
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
      </div>

      <div className="flex h-20 w-full shrink-0 items-end justify-center pb-1">
        <ButtonWithIcon
          onClick={photoPreview ? handleSubmit : isCameraOpen ? handleCapturePhoto : openIntegratedCamera}
          text={hasUploaded ? 'En attente' : photoPreview ? 'Valider la photo' : isCameraOpen ? 'Prendre la photo' : 'Ouvrir la caméra'}
          disabled={isUploading || hasUploaded || (isCameraOpen && (cameraMode === 'opening' || !isVideoReady))}
          className="w-fit whitespace-nowrap"
        />
      </div>
    </ActivityScreen>
  )
}
