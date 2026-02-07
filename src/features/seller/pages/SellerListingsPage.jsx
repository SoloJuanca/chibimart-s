import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import Container from '../../../components/layout/Container'
import Header from '../../../components/layout/Header'
import Footer from '../../../components/layout/Footer'
import { navCategories, sellerCategories } from '../../../data/categories'
import { useAuth } from '../../../context/AuthContext'
import {
  getListingDraftByUser,
  getListingById,
  publishListing,
  upsertListing,
  uploadListingImage,
  uploadListingVariantImage,
} from '../services/listingService'
import styles from './SellerListingsPage.module.css'

function SellerListingsPage() {
  const { auth } = useAuth()
  const userId = auth?.id || auth?.email || ''
  const navigate = useNavigate()
  const { listingId: listingIdParam } = useParams()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '',
    description: '',
    origin: '',
    isCreator: false,
    condition: '',
    stock: '',
    hasVariants: '',
  })
  const [photos, setPhotos] = useState([])
  const [errors, setErrors] = useState({})
  const maxPhotos = 6
  const [categorySelection, setCategorySelection] = useState({
    category: null,
    subcategory: null,
    tertiary: null,
  })
  const [step3Mode, setStep3Mode] = useState('variants')
  const [activeImageTarget, setActiveImageTarget] = useState(null)
  const [variantImages, setVariantImages] = useState({})
  const [variants, setVariants] = useState([
    { id: 'variant-1', label: 'Variante 1', type: 'Color', options: ['Morado sólido', 'Morado cósmico', 'Gamecube'] },
    { id: 'variant-2', label: 'Variante 2', type: 'Tamaño', options: [''] },
  ])
  const [price, setPrice] = useState('100.00')
  const [shippingMode, setShippingMode] = useState('self')
  const [freeShipping, setFreeShipping] = useState(false)
  const SHIPPING_COUNTRIES = [
    'México',
    'Estados Unidos',
    'Colombia',
    'España',
    'Argentina',
    'Chile',
    'Perú',
  ]
  const defaultShippingRows = [
    { id: 'row-1', country: 'México', price: '50' },
    { id: 'row-2', country: 'Estados Unidos', price: '400' },
    { id: 'row-3', country: 'España', price: '500' },
  ]
  const [shippingRows, setShippingRows] = useState(defaultShippingRows)
  const [listingId, setListingId] = useState(listingIdParam || null)
  const normalizeCountryValue = (value) => {
    const normalized = String(value || '').trim().toLowerCase()
    if (!normalized) return ''
    const directMatch = SHIPPING_COUNTRIES.find(
      (country) => country.toLowerCase() === normalized,
    )
    if (directMatch) return directMatch
    if (normalized.includes('mex')) return 'México'
    if (normalized.includes('usa') || normalized.includes('eeuu') || normalized.includes('estados') || normalized.includes('norteamerica') || normalized.includes('norteamérica')) {
      return 'Estados Unidos'
    }
    if (normalized.includes('colombia')) return 'Colombia'
    if (normalized.includes('espana') || normalized.includes('españa') || normalized.includes('europa')) {
      return 'España'
    }
    if (normalized.includes('argentina')) return 'Argentina'
    if (normalized.includes('chile')) return 'Chile'
    if (normalized.includes('peru') || normalized.includes('perú')) return 'Perú'
    return ''
  }

  const [listingStatus, setListingStatus] = useState('DRAFT')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [variantPrices, setVariantPrices] = useState({})
  const [variantStocks, setVariantStocks] = useState({})

  console.log(form)
  console.log(categorySelection)

  const hasVariants = form.hasVariants === 'yes'
  const needsPhotos = form.hasVariants === 'no'
  const canShowCreator = form.origin === 'NEW'
  const canShowCondition = form.origin === 'USED'
  const selectionTitle = form.title?.trim() || 'este artículo'

  const photoPreviews = useMemo(
    () =>
      photos.map((photo) => ({
        name: photo.fileName,
        url: photo.url,
      })),
    [photos],
  )

  const variantPreviewMap = useMemo(() => {
    const map = {}
    Object.entries(variantImages).forEach(([key, files]) => {
      if (files?.length) {
        map[key] = files[0].url
      }
    })
    return map
  }, [variantImages])

  const activeVariantImages =
    activeImageTarget && variantImages[`${activeImageTarget.variantIndex}-${activeImageTarget.optionIndex}`]
      ? variantImages[`${activeImageTarget.variantIndex}-${activeImageTarget.optionIndex}`]
      : []

  const activeVariantPreviews = useMemo(
    () =>
      activeVariantImages.map((file) => ({
        name: file.fileName,
        url: file.url,
      })),
    [activeVariantImages],
  )

  useEffect(() => {
    if (!userId) return
    let isMounted = true
    const fetchListing = listingIdParam
      ? getListingById(listingIdParam)
      : getListingDraftByUser(userId)
    fetchListing
      .then((data) => {
        if (!isMounted || !data) return
        setListingId(data.id || null)
        setListingStatus(data.status || 'DRAFT')
        if (data.basic) {
          setForm((prev) => ({ ...prev, ...data.basic }))
        }
        if (data.category) {
          setCategorySelection((prev) => ({ ...prev, ...data.category }))
        }
        if (Array.isArray(data.variants) && data.variants.length > 0) {
          setVariants(data.variants)
        }
        if (data.pricing?.price) setPrice(String(data.pricing.price))
        if (data.pricing?.variantPrices) setVariantPrices(data.pricing.variantPrices)
        if (data.pricing?.variantStocks) setVariantStocks(data.pricing.variantStocks)
        if (data.shipping) {
          setShippingMode(data.shipping.mode || 'self')
          setFreeShipping(Boolean(data.shipping.freeShipping))
          const incomingRows =
            Array.isArray(data.shipping.rows) && data.shipping.rows.length > 0
              ? data.shipping.rows
              : defaultShippingRows
          const normalized = incomingRows.map((row, index) => ({
            id: row.id || `row-${index + 1}`,
            country: normalizeCountryValue(row.country || row.destination),
            price: row.price || '',
          }))
          setShippingRows(normalized)
        }
        if (data.images?.photos) {
          setPhotos(data.images.photos)
        }
        if (data.images?.variantImages) {
          setVariantImages(data.images.variantImages)
        }
        if (typeof data.step === 'number' && !listingIdParam) {
          setStep(Math.min(Math.max(data.step, 1), 4))
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [userId, listingIdParam])

  useEffect(() => {
    if (step === 3 && form.hasVariants === 'no') {
      setStep(4)
    }
  }, [step, form.hasVariants])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handlePhotoChange = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length || !userId) return
    const remaining = Math.max(maxPhotos - photos.length, 0)
    const nextFiles = remaining > 0 ? files.slice(0, remaining) : []
    for (const file of nextFiles) {
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(new Error('No pudimos leer el archivo.'))
          reader.readAsDataURL(file)
        })
        const uploaded = await uploadListingImage({
          userId,
          listingId,
          fileName: file.name,
          dataUrl,
        })
        setPhotos((prev) => [
          ...prev,
          { url: uploaded.downloadUrl, fileName: uploaded.fileName || file.name },
        ])
      } catch (error) {
        setSaveError(error?.message || 'No pudimos subir la imagen.')
      }
    }
    event.target.value = ''
  }

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index))
  }

  const validateStep = () => {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Ingresa un título.'
    if (!form.description.trim()) nextErrors.description = 'Ingresa una descripción.'
    if (!form.origin) nextErrors.origin = 'Selecciona una opción.'
    if (canShowCreator === false && canShowCondition === false) {
      nextErrors.origin = 'Selecciona una opción.'
    }
    if (canShowCondition && !form.condition) nextErrors.condition = 'Selecciona el estado.'
    if (form.hasVariants === 'no') {
      if (!form.stock.trim()) nextErrors.stock = 'Ingresa el stock disponible.'
      if (Number.isNaN(Number(form.stock)) || Number(form.stock) < 0) {
        nextErrors.stock = 'Ingresa un número válido.'
      }
    }
    if (!form.hasVariants) nextErrors.hasVariants = 'Selecciona una opción.'
    if (needsPhotos && photos.length < 1) nextErrors.photos = 'Sube al menos una foto.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validateStep()) return
    handleSaveDraft({ targetStep: 1 }).then(() => setStep(2))
  }

  const currentCategory = sellerCategories.find((item) => item.label === categorySelection.category) || null
  const currentSubcategory =
    currentCategory?.subcategories?.find((item) => item.label === categorySelection.subcategory) || null
  const hasSubcategories = Boolean(currentCategory?.subcategories?.length)
  const hasTertiary = Boolean(currentSubcategory?.subcategories?.length)
  const selectionComplete =
    Boolean(categorySelection.category) &&
    (!hasSubcategories || Boolean(categorySelection.subcategory)) &&
    (!hasTertiary || Boolean(categorySelection.tertiary))

  const listStage = !categorySelection.category
    ? 'category'
    : hasSubcategories && !categorySelection.subcategory
      ? 'subcategory'
      : hasTertiary
        ? 'tertiary'
        : 'done'

  const listOptions =
    listStage === 'category'
      ? sellerCategories
      : listStage === 'subcategory'
        ? currentCategory?.subcategories || []
        : listStage === 'tertiary'
          ? currentSubcategory?.subcategories || []
          : []

  const handleSelectCategory = (label) => {
    setCategorySelection({ category: label, subcategory: null, tertiary: null })
  }

  const handleSelectSubcategory = (label) => {
    setCategorySelection((prev) => ({ ...prev, subcategory: label, tertiary: null }))
  }

  const handleSelectTertiary = (label) => {
    setCategorySelection((prev) => ({ ...prev, tertiary: label }))
  }

  const handleEditSelection = () => {
    setCategorySelection({ category: null, subcategory: null, tertiary: null })
  }

  const commissionPercent = Number(import.meta.env.VITE_MARKETPLACE_COMMISSION || 5)
  const priceValue = Number(price || 0)
  const effectivePriceValue = hasVariants
    ? Number(Object.values(variantPrices).find((value) => Number(value) > 0) || priceValue || 0)
    : priceValue
  const commissionAmount = effectivePriceValue * (commissionPercent / 100)
  const payoutAmount = Math.max(effectivePriceValue - commissionAmount, 0)

  const formatCurrency = (value) =>
    value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

  const summaryImages = useMemo(() => {
    if (photoPreviews.length) return photoPreviews
    const variantImagesList = Object.entries(variantPreviewMap).map(([key, url]) => ({
      url,
      name: `Variante ${key}`,
    }))
    return variantImagesList
  }, [photoPreviews, variantPreviewMap])

  const stepTitle =
    step === 1 ? '¿Qué deseas vender?' : step === 4 ? 'Confirmación' : 'Especificaciones'

  const step3Title =
    step3Mode === 'variants' ? 'Especificar variantes' : 'Especificar cantidades por variante'

  const handleVariantTypeChange = (index, value) => {
    setVariants((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, type: value } : item)),
    )
  }

  const handleOptionChange = (variantIndex, optionIndex, value) => {
    setVariants((prev) =>
      prev.map((item, idx) => {
        if (idx !== variantIndex) return item
        const nextOptions = item.options.map((opt, optIdx) =>
          optIdx === optionIndex ? value : opt,
        )
        return { ...item, options: nextOptions }
      }),
    )
  }

  const handleAddOption = (variantIndex) => {
    setVariants((prev) =>
      prev.map((item, idx) =>
        idx === variantIndex ? { ...item, options: [...item.options, ''] } : item,
      ),
    )
  }

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `variant-${prev.length + 1}`,
        label: `Variante ${prev.length + 1}`,
        type: 'Color',
        options: [''],
      },
    ])
  }

  const handleRemoveVariant = (index) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleOpenImageModal = (variantIndex, optionIndex) => {
    setActiveImageTarget({ variantIndex, optionIndex })
  }

  const handleCloseImageModal = () => {
    setActiveImageTarget(null)
  }

  const handleVariantImageChange = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length || !activeImageTarget || !userId) return
    const key = `${activeImageTarget.variantIndex}-${activeImageTarget.optionIndex}`
    const existing = variantImages[key] || []
    const remaining = Math.max(maxPhotos - existing.length, 0)
    const nextFiles = remaining > 0 ? files.slice(0, remaining) : []
    for (const file of nextFiles) {
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(new Error('No pudimos leer el archivo.'))
          reader.readAsDataURL(file)
        })
        const uploaded = await uploadListingVariantImage({
          userId,
          listingId,
          fileName: file.name,
          dataUrl,
          variantKey: key,
        })
        setVariantImages((prev) => ({
          ...prev,
          [key]: [
            ...(prev[key] || []),
            { url: uploaded.downloadUrl, fileName: uploaded.fileName || file.name },
          ],
        }))
      } catch (error) {
        setSaveError(error?.message || 'No pudimos subir la imagen.')
      }
    }
    event.target.value = ''
  }

  const handleRemoveVariantImage = (index) => {
    if (!activeImageTarget) return
    const key = `${activeImageTarget.variantIndex}-${activeImageTarget.optionIndex}`
    setVariantImages((prev) => {
      const existing = prev[key] || []
      return { ...prev, [key]: existing.filter((_, idx) => idx !== index) }
    })
  }

  const handleVariantPriceChange = (variantIndex, optionIndex, value) => {
    const key = `${variantIndex}-${optionIndex}`
    setVariantPrices((prev) => ({ ...prev, [key]: value }))
  }

  const handleVariantStockChange = (variantIndex, optionIndex, value) => {
    const key = `${variantIndex}-${optionIndex}`
    setVariantStocks((prev) => ({ ...prev, [key]: value }))
  }

  const validateVariantStocks = () => {
    const variantOptions = variants[0]?.options || []
    const hasInvalidStock = variantOptions.some((_, optionIndex) => {
      const value = variantStocks[`0-${optionIndex}`]
      return value === '' || value === undefined || Number(value) < 0
    })
    if (hasInvalidStock) {
      setErrors((prev) => ({ ...prev, variantStocks: 'Completa el stock para cada variante.' }))
      return false
    }
    setErrors((prev) => {
      if (!prev.variantStocks) return prev
      const { variantStocks: _ignored, ...rest } = prev
      return rest
    })
    return true
  }

  const handleSaveDraft = async ({ targetStep } = {}) => {
    if (!userId) return
    setSaving(true)
    setSaveError('')
    const toastId = toast.loading('Guardando cambios...')
    try {
      const payload = {
        id: listingId,
        userId,
        status: listingStatus || 'DRAFT',
        step: targetStep || step,
        basic: {
          title: form.title,
          description: form.description,
          origin: form.origin,
          isCreator: form.isCreator,
          condition: form.condition,
          stock: form.stock,
          hasVariants: form.hasVariants,
        },
        category: { ...categorySelection },
        variants,
        pricing: { price, variantPrices, variantStocks },
        shipping: { mode: shippingMode, freeShipping, rows: shippingRows },
        images: {
          photos,
          variantImages,
        },
      }
      const saved = await upsertListing(payload)
      toast.success('Cambios guardados.', { id: toastId })
      if (saved?.id && !listingId) setListingId(saved.id)
      return saved?.id || listingId
    } catch (error) {
      toast.error(error?.message || 'No pudimos guardar el listing.', { id: toastId })
      setSaveError(error?.message || 'No pudimos guardar el listing.')
      return null
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    const nextId = await handleSaveDraft({ targetStep: 4 })
    if (!nextId) return
    setSaving(true)
    setSaveError('')
    const toastId = toast.loading('Publicando producto...')
    try {
      await publishListing(nextId)
      toast.success('Producto publicado.', { id: toastId })
      navigate('/seller/products')
    } catch (error) {
      toast.error(error?.message || 'No pudimos publicar el listing.', { id: toastId })
      setSaveError(error?.message || 'No pudimos publicar el listing.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndExit = async () => {
    const savedId = await handleSaveDraft({ targetStep: 4 })
    if (savedId) {
      navigate('/seller/products')
    }
  }

  const handleStepNavigation = async (targetStep) => {
    if (saving || targetStep === step) return
    const savedId = await handleSaveDraft({ targetStep: step })
    if (!savedId) return
    if (targetStep === 3 && form.hasVariants === 'yes') {
      setStep3Mode('variants')
    }
    setStep(targetStep)
  }

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Toaster position="top-right" />
        <Container>
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <span className={styles.sidebarLabel}>Pasos</span>
              <button
                type="button"
                className={`${styles.stepNavButton} ${step === 1 ? styles.stepNavButtonActive : ''}`}
                onClick={() => handleStepNavigation(1)}
              >
                1. Detalles
              </button>
              <button
                type="button"
                className={`${styles.stepNavButton} ${step === 2 ? styles.stepNavButtonActive : ''}`}
                onClick={() => handleStepNavigation(2)}
              >
                2. Categoría
              </button>
              <button
                type="button"
                className={`${styles.stepNavButton} ${step === 3 ? styles.stepNavButtonActive : ''}`}
                onClick={() => handleStepNavigation(3)}
              >
                3. Variantes
              </button>
              <button
                type="button"
                className={`${styles.stepNavButton} ${step === 4 ? styles.stepNavButtonActive : ''}`}
                onClick={() => handleStepNavigation(4)}
              >
                4. Confirmación
              </button>
            </aside>
            <div className={styles.content}>
              <div className={styles.headerRow}>
                <Link className={styles.backLink} to="/seller">
                  &lsaquo; Anterior
                </Link>
                <span className={styles.stepLabel}>Paso {step} de 4</span>
                <h1>{stepTitle}</h1>
              </div>

            {step === 1 && (
              <section className={styles.card}>
                <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label htmlFor="title">Título</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Escribe aquí"
                    value={form.title}
                    onChange={handleChange}
                  />
                  {errors.title && <span className={styles.error}>{errors.title}</span>}
                </div>

                <div className={styles.field}>
                  <label htmlFor="description">Descripción</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Escribe aquí"
                    value={form.description}
                    onChange={handleChange}
                  />
                  {errors.description && <span className={styles.error}>{errors.description}</span>}
                </div>

                <div className={styles.field}>
                  <span className={styles.legend}>¿Cuál es el origen de lo que ofreces?</span>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioRow}>
                      <input
                        type="radio"
                        name="origin"
                        value="NEW"
                        checked={form.origin === 'NEW'}
                        onChange={handleChange}
                      />
                      Nuevo
                    </label>
                    <label className={styles.radioRow}>
                      <input
                        type="radio"
                        name="origin"
                        value="USED"
                        checked={form.origin === 'USED'}
                        onChange={handleChange}
                      />
                      De segunda mano
                    </label>
                  </div>
                  {errors.origin && <span className={styles.error}>{errors.origin}</span>}
                </div>

                {canShowCreator && (
                  <div className={styles.field}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        name="isCreator"
                        checked={form.isCreator}
                        onChange={handleChange}
                      />
                      <span>Soy creador/a del artículo</span>
                    </label>
                    <p className={styles.helperText}>
                      Responsable principal de la fabricación de este producto.
                    </p>
                  </div>
                )}

                {canShowCondition && (
                  <div className={styles.field}>
                    <span className={styles.legend}>¿En qué estado está?</span>
                    <div className={styles.radioGroup}>
                      {['COMO_NUEVO', 'USADO', 'DEPLORABLE', 'NO_FUNCIONAL'].map((value) => (
                        <label key={value} className={styles.radioRow}>
                          <input
                            type="radio"
                            name="condition"
                            value={value}
                            checked={form.condition === value}
                            onChange={handleChange}
                          />
                          {value === 'COMO_NUEVO'
                            ? 'Como nuevo'
                            : value === 'USADO'
                              ? 'Usado'
                              : value === 'DEPLORABLE'
                                ? 'Deplorable'
                                : 'No funcional'}
                        </label>
                      ))}
                    </div>
                    {errors.condition && <span className={styles.error}>{errors.condition}</span>}
                  </div>
                )}

                <div className={styles.field}>
                  <span className={styles.legend}>¿Este artículo tiene diferentes variantes?</span>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioRow}>
                      <input
                        type="radio"
                        name="hasVariants"
                        value="yes"
                        checked={form.hasVariants === 'yes'}
                        onChange={handleChange}
                      />
                      Sí, tiene variantes
                    </label>
                    <label className={styles.radioRow}>
                      <input
                        type="radio"
                        name="hasVariants"
                        value="no"
                        checked={form.hasVariants === 'no'}
                        onChange={handleChange}
                      />
                      No, es un artículo único
                    </label>
                  </div>
                  {errors.hasVariants && <span className={styles.error}>{errors.hasVariants}</span>}
                </div>
                {console.log(form)}
                {form.hasVariants !== "" && form.hasVariants !== 'yes' && (
                  <div className={styles.field}>
                    <label htmlFor="stock">Cantidad de artículos</label>
                    <input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.stock}
                      onChange={handleChange}
                    />
                    {errors.stock && <span className={styles.error}>{errors.stock}</span>}
                  </div>
                )}

                {needsPhotos && (
                  <div className={styles.photoSection}>
                    <div className={styles.photoHeader}>
                      <span className={styles.legend}>Fotografías del artículo</span>
                      <span className={styles.helperText}>
                        Límite {maxPhotos} fotografías por artículo.
                      </span>
                    </div>
                    <input
                      id="photos"
                      className={styles.hiddenInput}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                    />
                    <div className={styles.photoGrid}>
                      {photoPreviews.map((photo, index) => (
                        <div key={photo.url} className={styles.photoTile}>
                          <img src={photo.url} alt={photo.name} />
                          <button
                            type="button"
                            className={styles.photoRemove}
                            onClick={() => handleRemovePhoto(index)}
                            aria-label="Eliminar foto"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                      {photos.length < maxPhotos && (
                        <label className={styles.uploadTile} htmlFor="photos">
                          <span className={styles.uploadIcon}>↓</span>
                          <span>
                            Arrastra o <span className={styles.uploadLink}>sube aquí</span>
                            <br />
                            tus archivos
                          </span>
                        </label>
                      )}
                    </div>
                    <span className={styles.helperText}>
                      Tipo de archivos compatibles: .jpg, .gif, .png
                    </span>
                    {errors.photos && <span className={styles.error}>{errors.photos}</span>}
                  </div>
                )}

                <div className={styles.actions}>
                  <button className={styles.primaryButton} type="submit">
                    Continuar
                  </button>
                </div>
                </form>
              </section>
            )}

            {step === 2 && (
              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionLabel}>¿En qué categoría lo pondrías?</span>
                </div>
                <div className={styles.categoryList}>
                  {listOptions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={`${styles.categoryRow} ${
                        listStage === 'tertiary' && categorySelection.tertiary === item.label
                          ? styles.categoryRowSelected
                          : ''
                      }`}
                      onClick={() => {
                        if (listStage === 'category') handleSelectCategory(item.label)
                        if (listStage === 'subcategory') handleSelectSubcategory(item.label)
                        if (listStage === 'tertiary') handleSelectTertiary(item.label)
                      }}
                    >
                      <span>{item.label}</span>
                      {listStage === 'tertiary' ? (
                        <span className={styles.checkmark}>
                          {categorySelection.tertiary === item.label ? '✓' : ''}
                        </span>
                      ) : (
                        <span className={styles.chevron}>&gt;</span>
                      )}
                    </button>
                  ))}
                </div>
                {categorySelection.category && (
                  <div className={styles.selectionSummary}>
                    <div>
                      <span className={styles.summaryLabel}>Tu selección para:</span>
                      <strong>{selectionTitle}</strong>
                    </div>
                    <button type="button" className={styles.editButton} onClick={handleEditSelection}>
                      Editar
                    </button>
                    <div className={styles.selectionPath}>
                      {categorySelection.category}
                      {categorySelection.subcategory && ` > ${categorySelection.subcategory}`}
                      {categorySelection.tertiary && ` > ${categorySelection.tertiary}`}
                    </div>
                  </div>
                )}
                <div className={styles.actions}>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    disabled={!selectionComplete}
                    onClick={() => {
                      if (!selectionComplete) return
                      const nextStep = form.hasVariants === 'no' ? 4 : 3
                      handleSaveDraft({ targetStep: 2 }).then(() => setStep(nextStep))
                    }}
                  >
                    Continuar
                  </button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className={styles.card}>
                <div className={styles.selectionSummary}>
                  <div>
                    <span className={styles.summaryLabel}>Tu selección para:</span>
                    <strong>{selectionTitle}</strong>
                  </div>
                  <button type="button" className={styles.editButton} onClick={handleEditSelection}>
                    Editar
                  </button>
                  <div className={styles.selectionPath}>
                    {categorySelection.category}
                    {categorySelection.subcategory && ` > ${categorySelection.subcategory}`}
                    {categorySelection.tertiary && ` > ${categorySelection.tertiary}`}
                  </div>
                </div>

                {step3Mode === 'variants' && (
                  <>
                    <div className={styles.variantHeader}>
                      <div>
                        <h2>{step3Title}</h2>
                        <p className={styles.helperText}>Puede ser tamaños o colores</p>
                      </div>
                      <button type="button" className={styles.linkButton} onClick={handleAddVariant}>
                        + Agregar variante
                      </button>
                    </div>

                    {variants.map((variant, variantIndex) => (
                      <div key={variant.id} className={styles.variantBlock}>
                        <div className={styles.variantTitle}>
                          <span>{variant.label}</span>
                          {variantIndex > 0 && (
                            <button
                              type="button"
                              className={styles.removeButton}
                              onClick={() => handleRemoveVariant(variantIndex)}
                              aria-label="Eliminar variante"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className={styles.selectWrap}>
                          <select
                            value={variant.type}
                            onChange={(event) => handleVariantTypeChange(variantIndex, event.target.value)}
                          >
                            <option value="Color">Color</option>
                            <option value="Tamaño">Tamaño</option>
                            <option value="Modelo">Modelo</option>
                          </select>
                        </div>
                        <div className={styles.optionGroup}>
                          <span className={styles.optionLabel}>Opciones</span>
                          {variant.options.map((option, optionIndex) => (
                            <div key={`${variant.id}-option-${optionIndex}`} className={styles.optionRow}>
                              <span className={styles.optionIndex}>{optionIndex + 1}.</span>
                              <input
                                type="text"
                                placeholder="Escribe aquí..."
                                value={option}
                                onChange={(event) =>
                                  handleOptionChange(variantIndex, optionIndex, event.target.value)
                                }
                              />
                              <button
                                type="button"
                                className={styles.addIconButton}
                                onClick={() => handleAddOption(variantIndex)}
                                aria-label="Agregar opción"
                              >
                                +
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className={styles.actions}>
                      <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={() => {
                          handleSaveDraft({ targetStep: 3 }).then(() => setStep3Mode('quantities'))
                        }}
                      >
                        Guardar
                      </button>
                    </div>
                  </>
                )}

                {step3Mode === 'quantities' && (
                  <>
                    <div className={styles.variantHeader}>
                      <div>
                        <h2>{step3Title}</h2>
                      </div>
                    </div>
                    <div className={styles.quantitySelect}>
                      <label htmlFor="quantity-select">Cantidad:</label>
                      <select id="quantity-select">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                          <option key={count} value={count}>
                            {count}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.quantityTable}>
                      <div className={styles.quantityHeader}>
                        <div>Variante 1</div>
                        <div>Imágenes</div>
                        <div>Cantidades</div>
                      </div>
                      {variants[0]?.options.map((option, optionIndex) => (
                        <div key={`qty-row-${optionIndex}`} className={styles.quantityRow}>
                          <div className={styles.quantityCell}>
                            <span className={styles.optionIndex}>{optionIndex + 1}.</span>
                              <span>{option || 'Sin especificar'}</span>
                          </div>
                          <div className={styles.quantityCell}>
                            {variantPreviewMap[`0-${optionIndex}`] ? (
                              <button
                                type="button"
                                className={styles.imageEdit}
                                onClick={() => handleOpenImageModal(0, optionIndex)}
                              >
                                <img src={variantPreviewMap[`0-${optionIndex}`]} alt="Vista previa" />
                                <span>Editar</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={styles.imageAdd}
                                onClick={() => handleOpenImageModal(0, optionIndex)}
                              >
                                + Agregar imagen
                              </button>
                            )}
                          </div>
                          <div className={styles.quantityCell}>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              value={variantStocks[`0-${optionIndex}`] || ''}
                              onChange={(event) =>
                                handleVariantStockChange(0, optionIndex, event.target.value)
                              }
                            />
                          </div>
                        </div>
                      ))}
                      <button type="button" className={styles.addOptionButton}>
                        <span className={styles.addOptionIcon}>+</span>
                        Agregar opción
                      </button>
                    </div>
                    <div className={styles.actionsRow}>
                      <button className={styles.secondaryButton} type="button" onClick={() => setStep3Mode('variants')}>
                        Editar
                      </button>
                      <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={() => {
                          if (!validateVariantStocks()) return
                          handleSaveDraft({ targetStep: 3 }).then(() => setStep(4))
                        }}
                      >
                        Continuar
                      </button>
                    </div>
                    {errors.variantStocks && <span className={styles.error}>{errors.variantStocks}</span>}
                  </>
                )}
              </section>
            )}

            {step === 4 && (
              <section className={styles.confirmationGrid}>
                <div className={styles.confirmationCard}>
                  <div className={styles.confirmationHeader}>
                    <div>
                      <h2>{form.title || 'Título del producto'}</h2>
                      <p className={styles.helperText}>{form.description || 'Descripción del producto.'}</p>
                    </div>
                  </div>
                  <div className={styles.summaryImages}>
                    {console.log(summaryImages)}
                    {summaryImages.slice(0, 6).map((photo) => (
                      <img key={photo.url} src={photo.url} alt={photo.name} />
                    ))}
                    {summaryImages.length === 0 && (
                      <>
                        <div className={styles.imagePlaceholder} />
                        <div className={styles.imagePlaceholder} />
                        <div className={styles.imagePlaceholder} />
                        <div className={styles.imagePlaceholder} />
                      </>
                    )}
                  </div>
                  <div className={styles.summaryMeta}>
                    <span>Categoría</span>
                    <strong>
                      {categorySelection.category}
                      {categorySelection.subcategory && ` > ${categorySelection.subcategory}`}
                      {categorySelection.tertiary && ` > ${categorySelection.tertiary}`}
                    </strong>
                  </div>
                  {hasVariants && (
                    <div className={styles.summaryList}>
                      <div className={styles.summaryRow}>
                        <span>Cantidad</span>
                        <span>Color</span>
                      </div>
                      {variants[0]?.options.map((option, index) => (
                        <div key={`${option}-${index}`} className={styles.summaryRow}>
                          <span>1</span>
                          <span>{option || 'Sin especificar'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.sectionDivider} />

                  <div className={styles.field}>
                    <label htmlFor="price">Precio por artículo</label>
                    {!hasVariants && (
                      <div className={styles.priceInput}>
                        <span>$</span>
                        <input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={(event) => setPrice(event.target.value)}
                        />
                        <span>MXN</span>
                      </div>
                    )}
                    {hasVariants && (
                      <div className={styles.priceVariantTable}>
                        <div className={styles.priceVariantHeader}>
                          <span>Variante</span>
                          <span>Precio</span>
                        </div>
                        {variants[0]?.options.map((option, optionIndex) => (
                          <div key={`price-${optionIndex}`} className={styles.priceVariantRow}>
                            <span>{option || 'Sin especificar'}</span>
                            <div className={styles.priceInput}>
                              <span>$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={variantPrices[`0-${optionIndex}`] || ''}
                                onChange={(event) =>
                                  handleVariantPriceChange(0, optionIndex, event.target.value)
                                }
                              />
                              <span>MXN</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={styles.sectionDivider} />

                  <div className={styles.field}>
                    <label htmlFor="shippingMode">Forma de entrega</label>
                    <span className={styles.helperText}>Selecciona cómo entregas el producto</span>
                    <select
                      id="shippingMode"
                      value={shippingMode}
                      onChange={(event) => setShippingMode(event.target.value)}
                    >
                      <option value="self">Por tu cuenta</option>
                      <option value="marketplace">Marketplace</option>
                    </select>
                  </div>

                  <div className={styles.radioGroup}>
                    <label className={styles.radioRow}>
                      <input
                        type="radio"
                        name="freeShipping"
                        checked={freeShipping}
                        onChange={() => setFreeShipping(true)}
                      />
                      <span>Ofrecer envío gratis</span>
                    </label>
                    <span className={styles.helperText}>Tú absorbes el gasto del envío.</span>
                  </div>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioRow}>
                      <input
                        type="radio"
                        name="freeShipping"
                        checked={!freeShipping}
                        onChange={() => setFreeShipping(false)}
                      />
                      <span>No ofrecer envío gratis</span>
                    </label>
                    <span className={styles.helperText}>
                      El comprador deberá hacerse cargo del costo del envío.
                    </span>
                  </div>

                  <div className={styles.shippingTable}>
                    <div className={styles.shippingHeader}>
                      <span>Destino y forma de envío</span>
                      <span>Precio</span>
                    </div>
                    {shippingRows.map((row) => (
                      <div key={row.id} className={styles.shippingRow}>
                        <select
                          value={row.country}
                          onChange={(event) =>
                            setShippingRows((prev) =>
                              prev.map((item) =>
                                item.id === row.id ? { ...item, country: event.target.value } : item,
                              ),
                            )
                          }
                        >
                          <option value="">Selecciona país</option>
                          {SHIPPING_COUNTRIES.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="$"
                          value={row.price}
                          onChange={(event) =>
                            setShippingRows((prev) =>
                              prev.map((item) =>
                                item.id === row.id ? { ...item, price: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() =>
                        setShippingRows((prev) => [
                          ...prev,
                          { id: `row-${prev.length + 1}`, country: '', price: '' },
                        ])
                      }
                    >
                      + Agregar otro destino
                    </button>
                  </div>
                </div>

                <aside className={styles.summaryCard}>
                  <h3>Resumen estimado de cargos</h3>
                  <div className={styles.summaryItem}>
                    <div>
                      <strong>Precio por publicación</strong>
                    </div>
                    <span className={styles.summaryValue}>{formatCurrency(effectivePriceValue)}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <div>
                      <strong>Envío</strong>
                      <p>El comprador pagará el envío</p>
                    </div>
                    <span className={styles.summaryValue}>{formatCurrency(0)}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <div>
                      <strong>Comisión</strong>
                      <p>{commissionPercent}% comisión por transacción</p>
                    </div>
                    <span className={styles.summaryValue}>{formatCurrency(commissionAmount)}</span>
                  </div>
                  <div className={styles.summaryTotal}>
                    <strong>Recibirás por cada venta</strong>
                    <span>{formatCurrency(payoutAmount)}</span>
                  </div>
                </aside>

                <div className={styles.actionsRow}>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={handleSaveAndExit}
                    disabled={saving}
                  >
                    Guardar publicación
                  </button>
                  <button className={styles.primaryButton} type="button" onClick={handlePublish} disabled={saving}>
                    Publicar
                  </button>
                </div>
                {saveError && <div className={styles.error}>{saveError}</div>}
              </section>
            )}
          </div>
          </div>
        </Container>
      </main>
      <Footer />
      {activeImageTarget && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Imágenes por variante color</h3>
              <button type="button" onClick={handleCloseImageModal} aria-label="Cerrar">
                ×
              </button>
            </div>
            <div className={styles.photoSection}>
              <div className={styles.photoHeader}>
                <span className={styles.legend}>Fotografías del artículo</span>
                <span className={styles.helperText}>Límite {maxPhotos} fotografías por artículo.</span>
              </div>
              <input
                id="variant-photos"
                className={styles.hiddenInput}
                type="file"
                accept="image/*"
                multiple
                onChange={handleVariantImageChange}
              />
              <div className={styles.photoGrid}>
                {activeVariantPreviews.map((preview, index) => (
                  <div key={`${preview.name}-${index}`} className={styles.photoTile}>
                    <img src={preview.url} alt={preview.name} />
                    <button
                      type="button"
                      className={styles.photoRemove}
                      onClick={() => handleRemoveVariantImage(index)}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <label className={styles.uploadTile} htmlFor="variant-photos">
                  <span className={styles.uploadIcon}>↓</span>
                  <span>
                    Arrastra o <span className={styles.uploadLink}>sube aquí</span>
                    <br />
                    tus archivos
                  </span>
                </label>
              </div>
              <span className={styles.helperText}>Tipo de archivos compatibles: .jpg, .gif, .png</span>
            </div>
            <button className={styles.primaryButton} type="button" onClick={handleCloseImageModal}>
              Guardar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default SellerListingsPage
