import { getAdminStorage } from '../firebaseAdmin.js'

const sanitizeFileName = (value) =>
  value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)

const parseDataUrl = (dataUrl) => {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/)
  if (!match) {
    throw new Error('Formato de imagen inválido.')
  }
  return { contentType: match[1], buffer: Buffer.from(match[2], 'base64') }
}

export const uploadShopProfilePicture = async (req, res) => {
  try {
    const { userId, fileName, dataUrl } = req.body

    if (!userId || !dataUrl) {
      return res.status(400).json({ message: 'Faltan datos para subir la imagen.' })
    }

    const safeName = sanitizeFileName(fileName || 'shopProfilePicture.png')
    const filePath = `shops/${userId}/shopProfilePicture_${Date.now()}_${safeName}`
    const { contentType, buffer } = parseDataUrl(dataUrl)
    const bucket = getAdminStorage().bucket()
    const fileRef = bucket.file(filePath)

    await fileRef.save(buffer, {
      contentType,
      resumable: false,
    })
    const [downloadUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    })

    return res.status(200).json({ downloadUrl, filePath })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al subir la imagen.',
      error: error.message || 'Error desconocido',
    })
  }
}

export const uploadSellerDocument = async (req, res) => {
  try {
    const { userId, fileName, dataUrl, documentType } = req.body

    if (!userId || !dataUrl || !documentType) {
      return res.status(400).json({ message: 'Faltan datos para subir el documento.' })
    }

    const safeName = sanitizeFileName(fileName || 'documento.png')
    const filePath = `shops/${userId}/documents/${documentType}_${Date.now()}_${safeName}`
    const { contentType, buffer } = parseDataUrl(dataUrl)
    const bucket = getAdminStorage().bucket()
    const fileRef = bucket.file(filePath)

    await fileRef.save(buffer, {
      contentType,
      resumable: false,
    })
    const [downloadUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    })

    return res.status(200).json({
      downloadUrl,
      filePath,
      fileName: safeName,
      uploadedAt: new Date().toISOString(),
      type: documentType,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al subir el documento.',
      error: error.message || 'Error desconocido',
    })
  }
}
