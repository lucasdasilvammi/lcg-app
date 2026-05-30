import React, { useEffect, useRef, useState } from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import {
  ActivityScreen,
  ActivityHeaderTag,
  MaskAssetIcon,
  PhotoFrame,
  StatusTag
} from './ActivityShared'

const SESSION_TOKEN_KEY = 'lcg_session_token'

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

export default function ActiviteUpload({ roomData, currentUserId, submitPhoto }) {
  const interaction = roomData?.currentInteraction || {}
  const { uploadedPhotos = {}, participants = [], brandName = '' } = interaction
  const draftKey = getPhotoDraftKey(roomData?.id, brandName)
  const [photoPreview, setPhotoPreview] = useState(() => readPhotoDraft(draftKey))
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)
  const loadedDraftKeysRef = useRef(new Set())
  const hasUploaded = Boolean(uploadedPhotos[currentUserId])
  const uploadedCount = Object.keys(uploadedPhotos).filter(id => participants.includes(id)).length
  const totalCount = participants.length

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
    } catch (err) {
      console.error(err)
      setUploadError(err?.message || 'Erreur lors du traitement de la photo.')
      setPhotoPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleOpenCamera = async () => {
    setUploadError(null)
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      await document.exitFullscreen?.().catch(() => {})
    }
    window.setTimeout(() => fileInputRef.current?.click(), 50)
  }

  const handleDeletePhoto = () => {
    setUploadError(null)
    setPhotoPreview(null)
    setIsUploading(false)
    writePhotoDraft(draftKey, null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = () => {
    if (!photoPreview || hasUploaded) return
    setIsUploading(true)
    setUploadError(null)
    submitPhoto(photoPreview, (response) => {
      setIsUploading(false)
      if (response?.ok) {
        writePhotoDraft(draftKey, null)
        return
      }
      setUploadError(response?.reason || 'Envoi échoué. Réessaie.')
    })
  }

  const title = photoPreview ? 'Votre photo' : 'Prenez en photo votre dessin'

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
            <p className="max-w-72 font-funnel text-sm font-semibold text-red-primary">{uploadError}</p>
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
          onClick={photoPreview ? handleSubmit : handleOpenCamera}
          text={hasUploaded ? 'En attente' : photoPreview ? 'Valider la photo' : 'Ouvrir la caméra'}
          disabled={isUploading || hasUploaded}
          className="w-fit whitespace-nowrap"
        />
      </div>
    </ActivityScreen>
  )
}
