import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import Header from '../../../components/layout/Header'
import Footer from '../../../components/layout/Footer'
import { useAuth } from '../../../context/AuthContext'
import { navCategories } from '../../../data/categories'
import {
  getSellerApplicationByUser,
  submitSellerApplication,
  upsertSellerApplication,
} from '../services/sellerApplicationService'
import SellerProfileStep from '../components/SellerProfileStep'
import SellerShippingStep from '../components/SellerShippingStep'
import SellerValidationStep from '../components/SellerValidationStep'
import styles from './SellerApplyPage.module.css'

const NATIONALITIES = ['México', 'Argentina', 'Chile', 'Colombia', 'Perú', 'España']
const PHONE_CODES = [
  { label: '🇲🇽 +52', value: '+52' },
  { label: '🇺🇸 +1', value: '+1' },
  { label: '🇦🇷 +54', value: '+54' },
  { label: '🇨🇱 +56', value: '+56' },
  { label: '🇨🇴 +57', value: '+57' },
  { label: '🇵🇪 +51', value: '+51' },
  { label: '🇪🇸 +34', value: '+34' },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const STEP_LABELS = {
  profile: 'Datos',
  shipping: 'Configuración envíos',
  validation: 'Validación',
}

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getDocumentType = (fileName, existingDocs) => {
  const normalized = fileName.toLowerCase()
  if (normalized.includes('frente') || normalized.includes('front')) return 'INE_FRONT'
  if (normalized.includes('atras') || normalized.includes('atrás') || normalized.includes('back'))
    return 'INE_BACK'

  const hasFront = existingDocs.some((doc) => doc.type === 'INE_FRONT')
  return hasFront ? 'INE_BACK' : 'INE_FRONT'
}

const getDocumentTypeForMode = (mode, fileName, existingDocs) => {
  if (mode === 'INE_PHOTOS') {
    return getDocumentType(fileName, existingDocs)
  }
  return mode
}

const derivePhoneParts = (rawValue) => {
  if (!rawValue) return { phoneCountryCode: '+52', phoneNumber: '' }
  const normalized = rawValue.trim()
  if (normalized.startsWith('+')) {
    const [code, ...rest] = normalized.split(' ')
    return {
      phoneCountryCode: code || '+52',
      phoneNumber: rest.join(' ').trim(),
    }
  }
  return { phoneCountryCode: '+52', phoneNumber: normalized }
}

const createEmptyApplication = (userId) => ({
  id: '',
  userId,
  status: 'DRAFT',
  submittedAt: null,
  reviewedAt: null,
  decisionReason: '',
  profileData: {
    firstNames: '',
    lastNames: '',
    email: '',
    nationality: 'México',
    phoneCountryCode: '+52',
    phoneNumber: '',
    username: '',
    bio: '',
    avatarUrl: '',
  },
  shippingData: {
    streetAndNumber: '',
    country: 'México',
    zipCode: '',
    stateRegion1: '',
    city: '',
    stateRegion2: '',
    useProfileContact: false,
    contactPhoneCountryCode: '+52',
    contactPhoneNumber: '',
  },
  documents: [],
  createdAt: '',
  updatedAt: '',
})

function SellerApplyPage() {
  const { auth, setAuth } = useAuth()
  const userId = auth?.id || auth?.email || 'guest'
  const [activeStep, setActiveStep] = useState('profile')
  const [profileErrors, setProfileErrors] = useState({})
  const [shippingErrors, setShippingErrors] = useState({})
  const [validationError, setValidationError] = useState('')
  const [avatarStatus, setAvatarStatus] = useState({ loading: false, error: '' })
  const [saveStatus, setSaveStatus] = useState({ step: '', message: '' })
  const [profileFormError, setProfileFormError] = useState('')
  const [shippingFormError, setShippingFormError] = useState('')
  const [loading, setLoading] = useState(true)
  const [documentMode, setDocumentMode] = useState('INE_PHOTOS')
  const avatarInputRef = useRef(null)
  const documentInputRef = useRef(null)

  const [application, setApplication] = useState(() => createEmptyApplication(userId))

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    getSellerApplicationByUser(userId)
      .then((data) => {
        if (isMounted) setApplication(data)
      })
      .catch(() => {
        if (isMounted) setApplication(createEmptyApplication(userId))
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [userId])

  useEffect(() => {
    if (!auth) return
    const phoneParts = derivePhoneParts(auth.phone)
    setApplication((prev) => {
      const nextProfile = {
        ...prev.profileData,
        firstNames: prev.profileData.firstNames || auth.firstName || '',
        lastNames: prev.profileData.lastNames || auth.lastName || '',
        email: prev.profileData.email || auth.email || '',
        phoneCountryCode: prev.profileData.phoneCountryCode || phoneParts.phoneCountryCode,
        phoneNumber: prev.profileData.phoneNumber || phoneParts.phoneNumber,
      }
      const unchanged =
        nextProfile.firstNames === prev.profileData.firstNames &&
        nextProfile.lastNames === prev.profileData.lastNames &&
        nextProfile.email === prev.profileData.email &&
        nextProfile.phoneCountryCode === prev.profileData.phoneCountryCode &&
        nextProfile.phoneNumber === prev.profileData.phoneNumber
      if (unchanged) return prev
      return { ...prev, profileData: nextProfile }
    })
  }, [auth])

  useEffect(() => {
    if (!auth) return
    if (application.status === 'SUBMITTED' && !auth.roles?.includes('SELLER_PENDING')) {
      setAuth({
        ...auth,
        roles: Array.from(new Set([...(auth.roles || ['CUSTOMER']), 'SELLER_PENDING'])),
      })
    }
    if (application.status === 'APPROVED' && !auth.roles?.includes('SELLER')) {
      setAuth({
        ...auth,
        roles: Array.from(new Set([...(auth.roles || ['CUSTOMER']), 'SELLER'])),
      })
    }
  }, [application.status, auth, setAuth])

  const documentsByType = useMemo(() => {
    return application.documents.reduce((acc, document) => {
      acc[document.type] = document
      return acc
    }, {})
  }, [application.documents])

  const hasFront = Boolean(documentsByType.INE_FRONT)
  const hasBack = Boolean(documentsByType.INE_BACK)
  const hasSingleDoc = Boolean(documentsByType[documentMode])
  const canSubmitValidation = documentMode === 'INE_PHOTOS' ? hasFront && hasBack : hasSingleDoc

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setApplication((prev) => ({
      ...prev,
      profileData: {
        ...prev.profileData,
        [name]: value,
      },
    }))
  }

  const handleShippingChange = (event) => {
    const { name, value, type, checked } = event.target
    setApplication((prev) => ({
      ...prev,
      shippingData: {
        ...prev.shippingData,
        [name]: type === 'checkbox' ? checked : value,
      },
    }))
  }

  const validateProfile = () => {
    const errors = {}
    const profile = application.profileData
    if (!profile.firstNames.trim()) errors.firstNames = 'Ingresa tu nombre.'
    if (!profile.lastNames.trim()) errors.lastNames = 'Ingresa tus apellidos.'
    if (!profile.email.trim()) errors.email = 'Ingresa un correo válido.'
    if (!profile.phoneCountryCode) errors.phoneCountryCode = 'Selecciona la lada.'
    if (!profile.phoneNumber.trim()) errors.phoneNumber = 'Ingresa tu teléfono.'
    if (!profile.username.trim()) errors.username = 'Ingresa un nombre de usuario.'
    return errors
  }

  const validateShipping = () => {
    const errors = {}
    const shipping = application.shippingData
    if (!shipping.streetAndNumber.trim()) errors.streetAndNumber = 'Ingresa la calle.'
    if (!shipping.country) errors.country = 'Selecciona un país.'
    if (!/^\d{5}$/.test(shipping.zipCode)) errors.zipCode = 'El código postal debe tener 5 dígitos.'
    if (!shipping.stateRegion1.trim()) errors.stateRegion1 = 'Completa este campo.'
    if (!shipping.city.trim()) errors.city = 'Completa este campo.'
    if (!shipping.useProfileContact) {
      if (!shipping.contactPhoneCountryCode) {
        errors.contactPhoneCountryCode = 'Selecciona la lada.'
      }
      if (!shipping.contactPhoneNumber.trim()) {
        errors.contactPhoneNumber = 'Ingresa el teléfono de contacto.'
      }
    }
    return errors
  }

  const persistStep = async (step) => {
    const saved = await upsertSellerApplication(application)
    setApplication(saved)
    setSaveStatus({ step, message: 'Guardado' })
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    const errors = validateProfile()
    setProfileErrors(errors)
    if (Object.keys(errors).length === 0) {
      setProfileFormError('')
      await persistStep('profile')
      setActiveStep('shipping')
      return
    }
    setProfileFormError('Revisa los campos marcados antes de continuar.')
  }

  const handleShippingSubmit = async (event) => {
    event.preventDefault()
    const errors = validateShipping()
    setShippingErrors(errors)
    if (Object.keys(errors).length === 0) {
      setShippingFormError('')
      await persistStep('shipping')
      setActiveStep('validation')
      return
    }
    setShippingFormError('Revisa los campos marcados antes de continuar.')
  }

  const handleAvatarFile = async (file) => {
    if (!file) return
    setAvatarStatus({ loading: true, error: '' })
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('No pudimos leer el archivo.'))
        reader.readAsDataURL(file)
      })

      const response = await fetch(`${API_URL}/api/seller/shop-profile-picture`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId,
          fileName: file.name,
          dataUrl,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'No pudimos subir la imagen.')
      }
      const { downloadUrl } = payload
      setApplication((prev) => ({
        ...prev,
        profileData: {
          ...prev.profileData,
          avatarUrl: downloadUrl,
        },
      }))
    } catch (error) {
      setAvatarStatus({
        loading: false,
        error: error?.message || 'No pudimos subir la imagen.',
      })
      return
    }
    setAvatarStatus({ loading: false, error: '' })
  }

  const handleAvatarUpload = (event) => {
    const [file] = event.target.files || []
    handleAvatarFile(file)
  }

  const handleDocumentFile = async (file) => {
    if (!file) return
    const reader = new FileReader()
    const dataUrl = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('No pudimos leer el archivo.'))
      reader.readAsDataURL(file)
    })

    const type = getDocumentTypeForMode(documentMode, file.name, application.documents)
    const response = await fetch(`${API_URL}/api/seller/documents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId,
        fileName: file.name,
        dataUrl,
        documentType: type,
      }),
    })
    const payload = await response.json()
    if (!response.ok) {
      setValidationError(payload?.message || 'No pudimos subir el documento.')
      return
    }

    setApplication((prev) => {
      const incoming = {
        type: payload.type,
        fileUrl: payload.downloadUrl,
        fileName: payload.fileName || file.name,
        uploadedAt: payload.uploadedAt || new Date().toISOString(),
      }
      const keep =
        documentMode === 'INE_PHOTOS'
          ? prev.documents.filter((doc) => doc.type !== incoming.type)
          : []
      return {
        ...prev,
        documents: [...keep, incoming],
      }
    })
    setValidationError('')
  }

  const handleDocumentUpload = (event) => {
    const [file] = event.target.files || []
    handleDocumentFile(file)
  }

  const handleAvatarDrop = (event) => {
    event.preventDefault()
    const [file] = event.dataTransfer.files || []
    handleAvatarFile(file)
  }

  const handleDocumentDrop = (event) => {
    event.preventDefault()
    const [file] = event.dataTransfer.files || []
    handleDocumentFile(file)
  }

  const handleDocumentModeChange = (event) => {
    const nextMode = event.target.value
    setDocumentMode(nextMode)
    setValidationError('')
    setApplication((prev) => ({
      ...prev,
      documents: [],
    }))
  }

  const handleRemoveDocument = (type) => {
    setApplication((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.type !== type),
    }))
  }

  const handleSubmitValidation = async () => {
    if (!canSubmitValidation) {
      setValidationError('Debes cargar ambos documentos INE.')
      return
    }
    await persistStep('validation')
    const submitted = await submitSellerApplication(application.id)
    if (submitted) setApplication(submitted)
  }

  const handleEditSubmission = () => {
    setApplication((prev) => ({
      ...prev,
      status: 'DRAFT',
      decisionReason: '',
      reviewedAt: null,
    }))
    setActiveStep('validation')
  }

  const contactPhoneDisabled = application.shippingData.useProfileContact
  const contactPhoneCode = contactPhoneDisabled
    ? application.profileData.phoneCountryCode
    : application.shippingData.contactPhoneCountryCode
  const contactPhoneNumber = contactPhoneDisabled
    ? application.profileData.phoneNumber
    : application.shippingData.contactPhoneNumber

  const isSubmitted = application.status === 'SUBMITTED'
  const isApproved = application.status === 'APPROVED'
  const isRejected = application.status === 'REJECTED'
  const statusLabel = isApproved
    ? 'Aprobado'
    : isSubmitted
      ? 'Enviado a aprobación'
      : 'Borrador'

  const stepProgress = {
    profile: 33,
    shipping: 66,
    validation: 100,
  }
  const progressValue =
    isSubmitted || isApproved || isRejected ? 100 : stepProgress[activeStep] || 0

  if (loading) {
    return (
      <>
        <Header categories={navCategories} />
        <main className={styles.page}>
          <Container>
            <div className={styles.card}>Cargando perfil vendedor...</div>
          </Container>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.headerRow}>
            <Link className={styles.backLink} to="/">
              &lsaquo; Anterior
            </Link>
            <div className={styles.headerMain}>
              <h1>Mi perfil</h1>
              <div className={styles.headerMeta}>
                <span className={styles.statusBadge}>{statusLabel}</span>
                <div className={styles.progressWrap}>
                  <div className={styles.progressTrack}>
                    <span className={styles.progressFill} style={{ width: `${progressValue}%` }} />
                  </div>
                  <span className={styles.progressLabel}>{progressValue}% completado</span>
                </div>
                {saveStatus.message && (
                  <span className={styles.saveStatus}>
                    Último guardado: {STEP_LABELS[saveStatus.step] || saveStatus.step}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <button
                type="button"
                className={`${styles.stepButton} ${
                  activeStep === 'profile' ? styles.stepButtonActive : ''
                }`}
                onClick={() => setActiveStep('profile')}
              >
                Datos
              </button>
              <button
                type="button"
                className={`${styles.stepButton} ${
                  activeStep === 'shipping' ? styles.stepButtonActive : ''
                }`}
                onClick={() => setActiveStep('shipping')}
              >
                Configuración envíos
              </button>
              <button
                type="button"
                className={`${styles.stepButton} ${
                  activeStep === 'validation' ? styles.stepButtonActive : ''
                }`}
                onClick={() => setActiveStep('validation')}
              >
                Validación
              </button>
            </aside>

            <section className={styles.content}>
              {activeStep === 'profile' && (
                <SellerProfileStep
                  application={application}
                  auth={auth}
                  profileErrors={profileErrors}
                  formError={profileFormError}
                  avatarStatus={avatarStatus}
                  avatarInputRef={avatarInputRef}
                  nationalityOptions={NATIONALITIES}
                  phoneOptions={PHONE_CODES}
                  onProfileChange={handleProfileChange}
                  onAvatarUpload={handleAvatarUpload}
                  onAvatarDrop={handleAvatarDrop}
                  onRemoveAvatar={() =>
                    setApplication((prev) => ({
                      ...prev,
                      profileData: { ...prev.profileData, avatarUrl: '' },
                    }))
                  }
                  onSubmit={handleProfileSubmit}
                />
              )}

              {activeStep === 'shipping' && (
                <SellerShippingStep
                  application={application}
                  shippingErrors={shippingErrors}
                  formError={shippingFormError}
                  contactPhoneCode={contactPhoneCode}
                  contactPhoneNumber={contactPhoneNumber}
                  contactPhoneDisabled={contactPhoneDisabled}
                  nationalityOptions={NATIONALITIES}
                  phoneOptions={PHONE_CODES}
                  onShippingChange={handleShippingChange}
                  onSubmit={handleShippingSubmit}
                />
              )}

              {activeStep === 'validation' && (
                <SellerValidationStep
                  application={application}
                  documentMode={documentMode}
                  onDocumentModeChange={handleDocumentModeChange}
                  isSubmitted={isSubmitted}
                  isApproved={isApproved}
                  isRejected={isRejected}
                  formatDate={formatDate}
                  documentInputRef={documentInputRef}
                  onDocumentDrop={handleDocumentDrop}
                  onDocumentUpload={handleDocumentUpload}
                  onRemoveDocument={handleRemoveDocument}
                  validationError={validationError}
                  canSubmitValidation={canSubmitValidation}
                  onSubmitValidation={handleSubmitValidation}
                  onEditSubmission={handleEditSubmission}
                />
              )}
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default SellerApplyPage
