import React, { useEffect, useState, useRef } from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'

export default function ActiviteUpload({ roomData, currentUserId, submitPhoto }) {
  if (!roomData || !roomData.currentInteraction) return null
  
  const { uploadedPhotos = {} } = roomData.currentInteraction
  const hasUploaded = uploadedPhotos[currentUserId]
  const uploadedCount = Object.keys(uploadedPhotos).length
  const totalCount = roomData.currentInteraction.participants?.length || 0
  
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  const requestFullscreen = () => {
    if (typeof document === 'undefined') return
    if (document.fullscreenElement) return
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  useEffect(() => {
    if (!photoPreview || hasUploaded) return

    const restoreFullscreen = () => {
      if (document.visibilityState === 'visible') {
        requestFullscreen()
      }
    }

    requestFullscreen()
    window.addEventListener('focus', restoreFullscreen)
    document.addEventListener('visibilitychange', restoreFullscreen)

    return () => {
      window.removeEventListener('focus', restoreFullscreen)
      document.removeEventListener('visibilitychange', restoreFullscreen)
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

          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(dataUrl)
        }

        img.onerror = () => reject(new Error('Impossible de décoder l’image.'))
        img.src = reader.result
      }

      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    // Permet de re-sélectionner exactement le même fichier après
    event.target.value = ''
    if (!file) return

    setUploadError(null)
    setIsUploading(true)
    try {
      const resized = await fileToResizedDataUrl(file)
      setPhotoPreview(resized)
    } catch (err) {
      console.error(err)
      setUploadError(err?.message || 'Erreur lors du traitement de la photo.')
      setPhotoPreview(null)
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleOpenCamera = () => {
    setUploadError(null)
    fileInputRef.current?.click()
  }

  const handleDeletePhoto = () => {
    setUploadError(null)
    setPhotoPreview(null)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const handleSubmit = () => {
    if (photoPreview) {
      requestFullscreen()
      setIsUploading(true)
      setUploadError(null)
      submitPhoto(photoPreview, (response) => {
        setIsUploading(false)
        if (!response?.ok) {
          setUploadError(response?.reason || "Envoi échoué. Réessaie.")
        }
      })
    }
  }
  
  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
      <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col items-center justify-between gap-6 py-14 px-6 text-center">
        <div className='flex min-h-0 w-full flex-1 flex-col gap-8 phone:gap-12'>
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-hakobi uppercase text-orange-primary">📷 PHOTO</div>
            <p className="font-funnel text-lg text-light opacity-70">Prenez votre dessin en photo</p>
          </div>

          {/* Upload area */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            {photoPreview ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative overflow-hidden rounded-2xl border-2 border-orange-primary/50">
                  <img 
                    src={photoPreview} 
                    alt="Apercu du dessin" 
                    className="max-h-60 w-auto object-contain"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-funnel text-sm text-light/70">Apercu de votre dessin</p>
                  {!hasUploaded && (
                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      className="rounded-lg border border-light/20 bg-black/30 px-3 py-2 font-funnel text-sm text-light/80"
                    >
                      🗑️ Supprimer
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div 
                onClick={handleOpenCamera}
                className="flex h-60 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-light/30 bg-black/20"
              >
                <div className="text-6xl mb-4">📸</div>
                <p className="font-funnel text-lg text-light">Appuyez pour ouvrir la camera</p>
                <p className="font-funnel text-sm text-light/50 mt-2">Prenez votre dessin en photo</p>
              </div>
            )}
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {/* Upload status */}
            {uploadError && (
              <div className="rounded-xl bg-red-500/20 p-4 border border-red-500/30">
                <p className="font-funnel text-sm text-red-200">{uploadError}</p>
              </div>
            )}
            {hasUploaded ? (
              <div className="rounded-xl bg-green-500/20 p-4">
                <p className="font-funnel text-lg text-green-400">Photo envoyee !</p>
                <p className="font-funnel text-sm text-light/50">En attente des autres...</p>
              </div>
            ) : (
              <div className="rounded-xl bg-black/30 p-4">
                <p className="font-funnel text-sm text-light/50">{uploadedCount}/{totalCount} photos envoyees</p>
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="rounded-xl bg-black/20 p-4">
            <p className="font-funnel text-sm text-light/70">
              Prenez une photo claire de votre dessin. La photo ne sera pas montree aux autres joueurs.
            </p>
          </div>
        </div>

        <div className='flex w-full flex-col gap-5 phone:gap-8'>
          <ButtonWithIcon 
            onClick={photoPreview ? handleSubmit : handleOpenCamera}
            text={hasUploaded ? "En attente..." : photoPreview ? "Valider la photo" : "Ouvrir la camera"}
            disabled={isUploading || hasUploaded}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
