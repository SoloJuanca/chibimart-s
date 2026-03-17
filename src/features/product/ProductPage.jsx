import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useParams, useNavigate } from 'react-router-dom'
import Container from '../../components/layout/Container'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { navCategories } from '../../data/categories'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import SearchListingsGrid from '../search/components/SearchListingsGrid'
import { listFavoritesByUser, toggleFavorite } from '../search/services/favoriteService'
import {
  answerListingQuestion,
  askListingQuestion,
  getListingById,
  listListingQuestions,
  listRelatedListings,
  listReviewsBySeller,
  listSellerListings,
} from './services/productService'
import styles from './ProductPage.module.css'

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return '$0.00 MXN'
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(numeric)) return `$${value} MXN`
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(numeric)
}

const getGalleryImages = (listing) => {
  const photos = listing?.images?.photos || []
  if (photos.length) {
    return photos.map((photo) => photo.url).filter(Boolean)
  }
  const variantEntries = Object.values(listing?.images?.variantImages || {})
  const variantImages = variantEntries.flat().map((entry) => entry?.url).filter(Boolean)
  return variantImages
}

function ProductPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { addItem } = useCart()
  const userId = auth?.id || auth?.email || ''
  const [listing, setListing] = useState(null)
  const [activeImage, setActiveImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [questions, setQuestions] = useState([])
  const [questionInput, setQuestionInput] = useState('')
  const [answerEdits, setAnswerEdits] = useState({})
  const [sellerProducts, setSellerProducts] = useState([])
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [zoomOrigin, setZoomOrigin] = useState({ x: '50%', y: '50%' })
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [favoriteIds, setFavoriteIds] = useState([])

  useEffect(() => {
    if (!listingId) return
    let isMounted = true
    setLoading(true)
    setErrorMessage('')
    getListingById(listingId)
      .then((data) => {
        if (!isMounted) return
        setListing(data)
        const images = getGalleryImages(data)
        const options = data?.variants?.[0]?.options || []
        const firstValidIndex = options.findIndex((option) => Boolean(option))
        const nextIndex = firstValidIndex >= 0 ? firstValidIndex : 0
        setSelectedVariantIndex(nextIndex)
        const initialVariantKey = `0-${nextIndex}`
        const initialVariantImage = data?.images?.variantImages?.[initialVariantKey]?.[0]?.url
        setActiveImage(initialVariantImage || images[0] || '')
      })
      .catch((error) => {
        if (!isMounted) return
        setListing(null)
        setErrorMessage(error?.message || 'No pudimos cargar el producto.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [listingId])

  useEffect(() => {
    if (!listingId) return
    let isMounted = true
    listListingQuestions(listingId)
      .then((data) => {
        if (!isMounted) return
        setQuestions(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (isMounted) setQuestions([])
      })
    return () => {
      isMounted = false
    }
  }, [listingId])

  useEffect(() => {
    if (!listing?.userId) return
    let isMounted = true
    listSellerListings({ sellerId: listing.userId, excludeId: listingId, limit: 4 })
      .then((data) => {
        if (!isMounted) return
        setSellerProducts(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (isMounted) setSellerProducts([])
      })
    return () => {
      isMounted = false
    }
  }, [listing?.userId, listingId])

  useEffect(() => {
    if (!listing?.category?.category) return
    let isMounted = true
    listRelatedListings({ category: listing.category.category, excludeId: listingId, limit: 6 })
      .then((data) => {
        if (!isMounted) return
        setRelatedProducts(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (isMounted) setRelatedProducts([])
      })
    return () => {
      isMounted = false
    }
  }, [listing?.category?.category, listingId])

  useEffect(() => {
    if (!listing?.userId) return
    let isMounted = true
    listReviewsBySeller(listing.userId)
      .then((data) => {
        if (!isMounted) return
        setReviews(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (isMounted) setReviews([])
      })
    return () => {
      isMounted = false
    }
  }, [listing?.userId])

  useEffect(() => {
    if (!userId) {
      setFavoriteIds([])
      return
    }
    let isMounted = true
    listFavoritesByUser(userId)
      .then((data) => {
        if (!isMounted) return
        const ids = Array.isArray(data) ? data.map((item) => item.id) : []
        setFavoriteIds(ids)
      })
      .catch(() => {
        if (isMounted) setFavoriteIds([])
      })
    return () => {
      isMounted = false
    }
  }, [userId])

  const handleToggleFavorite = async (listingId) => {
    if (!listingId || !userId) return
    const previous = [...favoriteIds]
    setFavoriteIds((prev) =>
      prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId],
    )
    try {
      const result = await toggleFavorite({ userId, listingId })
      setFavoriteIds((prev) => {
        if (result.favorite) return prev.includes(listingId) ? prev : [...prev, listingId]
        return prev.filter((id) => id !== listingId)
      })
    } catch {
      setFavoriteIds(previous)
    }
  }

  const galleryImages = useMemo(() => getGalleryImages(listing), [listing])
  const isSeller = listing?.userId && auth?.id === listing.userId
  const variants = listing?.variants || []
  const hasVariants = listing?.basic?.hasVariants === 'yes' && variants.length > 0
  const variantOptions = variants[0]?.options
    ?.map((option, index) => ({ option, index }))
    .filter((item) => item.option) || []
  const variantKey = `0-${selectedVariantIndex}`
  const variantImage = listing?.images?.variantImages?.[variantKey]?.[0]?.url
  const variantPrice = listing?.pricing?.variantPrices?.[variantKey]
  const displayPrice =
    hasVariants && variantPrice !== undefined && variantPrice !== null && variantPrice !== ''
      ? variantPrice
      : listing?.pricing?.price
  const selectedVariant = variantOptions.find((item) => item.index === selectedVariantIndex)?.option
  const displayStock = hasVariants
    ? listing?.pricing?.variantStocks?.[variantKey]
    : listing?.basic?.stock
  const stockNum =
    displayStock !== undefined && displayStock !== null && displayStock !== ''
      ? Number(String(displayStock).replace(/[^0-9.-]/g, ''))
      : null
  const hasStock = stockNum !== null && Number.isFinite(stockNum) && stockNum > 0
  const maxQuantity = stockNum !== null && Number.isFinite(stockNum) ? Math.max(1, Math.floor(stockNum)) : 99

  useEffect(() => {
    setQuantity((prev) => Math.min(Math.max(1, prev), maxQuantity))
  }, [maxQuantity])

  const parsePrice = (value) => {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number' && Number.isFinite(value)) return value
    const numeric = Number(String(value).replace(/[^0-9.-]/g, ''))
    return Number.isFinite(numeric) ? numeric : 0
  }

  const unitPrice = parsePrice(displayPrice)
  const subtotal = unitPrice * quantity

  const buildCartDescription = (text) => {
    if (!text) return ''
    const normalized = String(text).trim()
    if (normalized.length <= 90) return normalized
    return `${normalized.slice(0, 90)}...`
  }

  const handleSubmitQuestion = async (event) => {
    event.preventDefault()
    if (!questionInput.trim() || !userId || !listingId) return
    const message = questionInput.trim()
    setQuestionInput('')
    try {
      const created = await askListingQuestion({ listingId, userId, question: message })
      setQuestions((prev) => [
        {
          ...created,
          question: message,
          userName: auth?.firstName ? `${auth.firstName} ${auth.lastName || ''}`.trim() : 'Cliente',
        },
        ...prev,
      ])
    } catch (error) {
      setQuestionInput(message)
    }
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswerEdits((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmitAnswer = async (questionId) => {
    const answer = answerEdits[questionId]?.trim()
    if (!answer || !auth?.id) return
    try {
      await answerListingQuestion({ questionId, sellerId: auth.id, answer })
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === questionId ? { ...item, answer, answeredAt: new Date().toISOString() } : item,
        ),
      )
      setAnswerEdits((prev) => ({ ...prev, [questionId]: '' }))
    } catch (error) {
      // ignore
    }
  }

  const handleVariantChange = (event) => {
    const nextIndex = Number(event.target.value)
    setSelectedVariantIndex(nextIndex)
    const nextVariantKey = `0-${nextIndex}`
    const nextImage = listing?.images?.variantImages?.[nextVariantKey]?.[0]?.url
    if (nextImage) {
      setActiveImage(nextImage)
    } else if (galleryImages.length) {
      setActiveImage(galleryImages[0])
    }
  }

  const handleZoomMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    setZoomOrigin({
      x: `${Math.max(0, Math.min(100, x)).toFixed(2)}%`,
      y: `${Math.max(0, Math.min(100, y)).toFixed(2)}%`,
    })
  }

  const handleZoomLeave = () => {
    setZoomOrigin({ x: '50%', y: '50%' })
  }

  const handleAddToCart = () => {
    if (!listing) return
    const variantKey = hasVariants ? `0-${selectedVariantIndex}` : 'default'
    const cartItem = {
      key: `${listingId}-${variantKey}`,
      id: listingId,
      title: listing.basic?.title || 'Producto',
      condition: listing.basic?.condition || 'Nuevo',
      quantity: Math.min(quantity, maxQuantity),
      maxQuantity,
      description: buildCartDescription(listing.basic?.description),
      size: listing.basic?.size || '',
      price: parsePrice(displayPrice),
      image: activeImage || galleryImages[0] || '/images/cart-placeholder.svg',
      imageAlt: listing.basic?.title || 'Producto',
      sellerId: listing.userId || '',
      sellerName: listing.sellerName || listing.seller?.name || 'Vendedor',
      sellerLabel: 'Productos vendidos por',
      variantLabel: selectedVariant || '',
      shipping: listing.shipping || null,
    }
    addItem(cartItem)
    toast.success('Producto agregado al carrito.')
  }

  const handleBuyNow = () => {
    if (!listing) return
    const variantKey = hasVariants ? `0-${selectedVariantIndex}` : 'default'
    const cartItem = {
      key: `${listingId}-${variantKey}`,
      id: listingId,
      title: listing.basic?.title || 'Producto',
      condition: listing.basic?.condition || 'Nuevo',
      quantity: Math.min(quantity, maxQuantity),
      maxQuantity,
      description: buildCartDescription(listing.basic?.description),
      size: listing.basic?.size || '',
      price: parsePrice(displayPrice),
      image: activeImage || galleryImages[0] || '/images/cart-placeholder.svg',
      imageAlt: listing.basic?.title || 'Producto',
      sellerId: listing.userId || '',
      sellerName: listing.sellerName || listing.seller?.name || 'Vendedor',
      sellerLabel: 'Productos vendidos por',
      variantLabel: selectedVariant || '',
      shipping: listing.shipping || null,
    }
    addItem(cartItem)
    const sellerId = listing.userId || ''
    if (sellerId) {
      navigate(`/checkout?sellerId=${encodeURIComponent(sellerId)}`)
    } else {
      navigate('/checkout')
    }
  }

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.breadcrumb}>Inicio / Producto</div>
          {loading && <div className={styles.state}>Cargando producto...</div>}
          {!loading && errorMessage && <div className={styles.state}>{errorMessage}</div>}
          {!loading && !errorMessage && listing && (
            <>
              <div className={styles.layout}>
                <div className={styles.leftColumn}>
                  <section className={styles.hero}>
                    <div className={styles.gallery}>
                    <div
                      className={styles.mainImage}
                      style={{ '--zoom-x': zoomOrigin.x, '--zoom-y': zoomOrigin.y }}
                      onMouseMove={handleZoomMove}
                      onMouseLeave={handleZoomLeave}
                    >
                        {activeImage ? <img src={activeImage} alt={listing.basic?.title || 'Producto'} /> : null}
                      </div>
                      <div className={styles.thumbs}>
                        {galleryImages.map((image) => (
                          <button
                            key={image}
                            type="button"
                            className={`${styles.thumb} ${activeImage === image ? styles.thumbActive : ''}`}
                            onClick={() => setActiveImage(image)}
                            aria-label="Ver imagen"
                          >
                            <img src={image} alt="" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className={styles.section}>
                    <h2>Sobre este producto</h2>
                    <p>{listing.basic?.description || 'Sin descripción disponible.'}</p>
                  </section>

                  <section className={styles.section}>
                    <h2>Pregúntale al vendedor</h2>
                    {!userId && <div className={styles.state}>Inicia sesión para hacer una pregunta.</div>}
                    {userId && (
                      <form className={styles.questionForm} onSubmit={handleSubmitQuestion}>
                        <input
                          type="text"
                          placeholder="Escribe tu pregunta..."
                          value={questionInput}
                          onChange={(event) => setQuestionInput(event.target.value)}
                        />
                        <button type="submit" className={styles.secondaryButton}>
                          Preguntar
                        </button>
                      </form>
                    )}
                    <div className={styles.questions}>
                      {questions.length === 0 && <div className={styles.state}>Aún no hay preguntas.</div>}
                      {questions.map((item) => (
                        <div key={item.id} className={styles.questionCard}>
                          <div className={styles.questionHeader}>
                            <strong>{item.userName || 'Cliente'}</strong>
                            <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
                          </div>
                          <p>{item.question}</p>
                          {item.answer ? (
                            <div className={styles.answer}>
                              <strong>Respuesta</strong>
                              <p>{item.answer}</p>
                            </div>
                          ) : isSeller ? (
                            <div className={styles.answerForm}>
                              <input
                                type="text"
                                placeholder="Responde esta pregunta..."
                                value={answerEdits[item.id] || ''}
                                onChange={(event) => handleAnswerChange(item.id, event.target.value)}
                              />
                              <button type="button" onClick={() => handleSubmitAnswer(item.id)}>
                                Responder
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className={styles.section}>
                    <h2>Más productos del vendedor</h2>
                    {sellerProducts.length === 0 ? (
                      <div className={styles.state}>No hay más productos disponibles.</div>
                    ) : (
                      <SearchListingsGrid
                      listings={sellerProducts}
                      favoriteIds={favoriteIds}
                      onToggleFavorite={handleToggleFavorite}
                    />
                    )}
                  </section>

                  <section className={styles.section}>
                    <h2>Opiniones de compradores</h2>
                    {reviews.length === 0 ? (
                      <div className={styles.state}>Aún no hay opiniones registradas.</div>
                    ) : (
                      <div className={styles.reviews}>
                        {reviews.map((review) => (
                          <div key={review.id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                              <strong>{review.userName || 'Cliente'}</strong>
                              <span>{review.rating ? `${review.rating} / 5` : '5 / 5'}</span>
                            </div>
                            <p>{review.comment || 'Sin comentario.'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className={styles.section}>
                    <h2>Productos relacionados</h2>
                    {relatedProducts.length === 0 ? (
                      <div className={styles.state}>No hay productos relacionados.</div>
                    ) : (
                      <SearchListingsGrid
                      listings={relatedProducts}
                      favoriteIds={favoriteIds}
                      onToggleFavorite={handleToggleFavorite}
                    />
                    )}
                  </section>
                </div>
                <aside className={styles.rightColumn}>
                  <div className={styles.infoCard}>
                    <span className={styles.badge}>Nuevo</span>
                    <h1>{listing.basic?.title || 'Sin título'}</h1>
                    <p className={styles.price}>{formatPrice(displayPrice)}</p>
                    <p className={styles.meta}>Hecho por: {listing.sellerName || 'Vendedor'}</p>
                    {hasVariants && (
                      <div className={styles.selectRow}>
                        <label htmlFor="variant-select">Variante</label>
                        <select
                          id="variant-select"
                          value={selectedVariantIndex}
                          onChange={handleVariantChange}
                        >
                          {variantOptions.map((item) => (
                            <option key={`${item.option}-${item.index}`} value={item.index}>
                              {item.option}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className={styles.infoRow}>
                      <span>Stock</span>
                      <strong
                        className={hasStock ? styles.stockInStock : ''}
                        aria-label={hasStock ? 'En stock' : 'Sin stock'}
                      >
                        {displayStock !== undefined && displayStock !== null && displayStock !== ''
                          ? String(displayStock)
                          : hasStock
                            ? 'Disponible'
                            : 'Sin stock'}
                      </strong>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Envío</span>
                      <span className={styles.breakdownLegend}>
                        Se calculará en el checkout según tu dirección
                      </span>
                    </div>
                    {hasStock && maxQuantity > 1 && (
                      <div className={styles.quantityRow}>
                        <label htmlFor="product-quantity">Cantidad</label>
                        <input
                          id="product-quantity"
                          type="number"
                          min={1}
                          max={maxQuantity}
                          value={quantity}
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            if (!Number.isFinite(v)) return
                            setQuantity(Math.min(maxQuantity, Math.max(1, Math.floor(v))))
                          }}
                          className={styles.quantityInput}
                          aria-label="Cantidad"
                        />
                      </div>
                    )}
                    <div className={styles.breakdown} role="region" aria-label="Desglose del precio">
                      <div className={styles.breakdownRow}>
                        <span>
                          {quantity > 1 ? `Subtotal (${quantity} × ${formatPrice(unitPrice)})` : 'Precio'}
                        </span>
                        <strong>{formatPrice(subtotal)}</strong>
                      </div>
                      <div className={styles.breakdownRow}>
                        <span>Envío</span>
                        <span className={styles.breakdownLegend}>
                          Se calculará en el checkout según tu dirección
                        </span>
                      </div>
                      <div className={`${styles.breakdownRow} ${styles.breakdownTotal}`}>
                        <span>Total (productos)</span>
                        <strong>{formatPrice(subtotal)}</strong>
                      </div>
                    </div>
                    <div className={styles.buttonRow}>
                      <button className={styles.primaryButton} type="button" onClick={handleAddToCart}>
                        Agregar al carrito
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleBuyNow}
                        disabled={!hasStock}
                      >
                        Comprar ahora
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default ProductPage
