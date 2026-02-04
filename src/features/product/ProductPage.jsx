import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Container from '../../components/layout/Container'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { navCategories } from '../../data/categories'
import { useAuth } from '../../context/AuthContext'
import SearchListingsGrid from '../search/components/SearchListingsGrid'
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
  const { auth } = useAuth()
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
                      <SearchListingsGrid listings={sellerProducts} showFavorite={false} />
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
                      <SearchListingsGrid listings={relatedProducts} showFavorite={false} />
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
                      <strong>{listing.basic?.stock || 'Disponible'}</strong>
                    </div>
                    <button className={styles.primaryButton} type="button">
                      Agregar al carrito
                    </button>
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
