import { useEffect, useState } from 'react'
import Container from '../../../components/layout/Container'
import Header from '../../../components/layout/Header'
import Footer from '../../../components/layout/Footer'
import { navCategories } from '../../../data/categories'
import {
  filterSellerApplications,
  reviewSellerApplication,
} from '../services/sellerApplicationService'
import styles from './SellerAdminPage.module.css'

const STATUS_OPTIONS = ['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DRAFT']

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function SellerAdminPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedId, setSelectedId] = useState(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [applications, setApplications] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    filterSellerApplications({ search, status: statusFilter })
      .then((data) => {
        if (!isMounted) return
        setApplications(data)
        if (data.length > 0) {
          const nextSelected = data.find((app) => app.id === selectedId) || data[0]
          setSelected(nextSelected)
          setSelectedId(nextSelected.id)
          setDecisionReason(nextSelected.decisionReason || '')
        } else {
          setSelected(null)
          setSelectedId(null)
        }
      })
      .catch(() => {
        if (isMounted) {
          setApplications([])
          setSelected(null)
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [search, statusFilter, selectedId])

  const handleApprove = async () => {
    if (!selected) return
    await reviewSellerApplication(selected.id, 'APPROVED', '')
    const updated = await filterSellerApplications({ search, status: statusFilter })
    setApplications(updated)
    const nextSelected = updated.find((app) => app.id === selected.id) || updated[0] || null
    setSelected(nextSelected)
    setSelectedId(nextSelected?.id || null)
  }

  const handleReject = async () => {
    if (!selected || !decisionReason.trim()) return
    await reviewSellerApplication(selected.id, 'REJECTED', decisionReason.trim())
    const updated = await filterSellerApplications({ search, status: statusFilter })
    setApplications(updated)
    const nextSelected = updated.find((app) => app.id === selected.id) || updated[0] || null
    setSelected(nextSelected)
    setSelectedId(nextSelected?.id || null)
  }

  return (
    <>
      <Header categories={navCategories} />
      <main className={styles.page}>
        <Container>
          <div className={styles.headerRow}>
            <h1>Panel de solicitudes vendedor</h1>
            <p>Revisa, aprueba o rechaza las solicitudes en espera.</p>
          </div>

          <div className={styles.filters}>
            <div className={styles.field}>
              <label htmlFor="search">Search</label>
              <input
                id="search"
                type="search"
                placeholder="Buscar por email o username"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="statusFilter">Filter status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.layout}>
            <section className={styles.list}>
              {loading && <div className={styles.emptyState}>Cargando solicitudes...</div>}
              {!loading && applications.length === 0 && (
                <div className={styles.emptyState}>No hay solicitudes con estos filtros.</div>
              )}
              {!loading &&
                applications.map((application) => (
                <button
                  key={application.id}
                  type="button"
                  className={`${styles.listItem} ${
                    application.id === selectedId ? styles.listItemActive : ''
                  }`}
                  onClick={() => {
                    setSelectedId(application.id)
                    setSelected(application)
                  }}
                >
                  <div>
                    <strong>{application.profileData.username || 'Sin usuario'}</strong>
                    <span>{application.profileData.email || 'Sin correo'}</span>
                  </div>
                  <span className={styles.status}>{application.status}</span>
                </button>
              ))}
            </section>

            <section className={styles.detail}>
              {!selected ? (
                <div className={styles.emptyState}>
                  Selecciona una solicitud para ver el detalle.
                </div>
              ) : (
                <div className={styles.card}>
                  <h2>Detalle solicitud</h2>
                  <div className={styles.section}>
                    <h3>Datos personales</h3>
                    <div className={styles.detailGrid}>
                      <div>
                        <span>Nombre(s)</span>
                        <strong>{selected.profileData.firstNames}</strong>
                      </div>
                      <div>
                        <span>Apellidos</span>
                        <strong>{selected.profileData.lastNames}</strong>
                      </div>
                      <div>
                        <span>Correo</span>
                        <strong>{selected.profileData.email}</strong>
                      </div>
                      <div>
                        <span>Nacionalidad</span>
                        <strong>{selected.profileData.nationality}</strong>
                      </div>
                      <div>
                        <span>Teléfono</span>
                        <strong>
                          {selected.profileData.phoneCountryCode} {selected.profileData.phoneNumber}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h3>Información pública</h3>
                    <div className={styles.detailGrid}>
                      <div>
                        <span>Nombre de usuario</span>
                        <strong>{selected.profileData.username}</strong>
                      </div>
                      <div>
                        <span>Descripción</span>
                        <strong>{selected.profileData.bio || '-'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h3>Configuración envíos</h3>
                    <div className={styles.detailGrid}>
                      <div>
                        <span>Calle y número</span>
                        <strong>{selected.shippingData.streetAndNumber}</strong>
                      </div>
                      <div>
                        <span>País</span>
                        <strong>{selected.shippingData.country}</strong>
                      </div>
                      <div>
                        <span>Código postal</span>
                        <strong>{selected.shippingData.zipCode}</strong>
                      </div>
                      <div>
                        <span>Estado/Provincia/Región</span>
                        <strong>{selected.shippingData.stateRegion1}</strong>
                      </div>
                      <div>
                        <span>Ciudad</span>
                        <strong>{selected.shippingData.city}</strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h3>Datos de contacto</h3>
                    <div className={styles.detailGrid}>
                      <div>
                        <span>Usa mismos datos</span>
                        <strong>{selected.shippingData.useProfileContact ? 'Sí' : 'No'}</strong>
                      </div>
                      <div>
                        <span>Teléfono contacto</span>
                        <strong>
                          {selected.shippingData.useProfileContact
                            ? `${selected.profileData.phoneCountryCode} ${selected.profileData.phoneNumber}`
                            : `${selected.shippingData.contactPhoneCountryCode} ${selected.shippingData.contactPhoneNumber}`}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h3>Documentos</h3>
                    <div className={styles.documentList}>
                      {selected.documents.map((doc) => (
                        <div key={doc.type} className={styles.documentRow}>
                          <img src={doc.fileUrl} alt="Documento" />
                          <div>
                            <strong>{doc.fileName}</strong>
                            <span>Subido el {formatDate(doc.uploadedAt)}</span>
                          </div>
                          <a href={doc.fileUrl} download={doc.fileName}>
                            Descargar
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.section}>
                    <label htmlFor="decisionReason">Motivo de rechazo</label>
                    <textarea
                      id="decisionReason"
                      rows={3}
                      value={decisionReason}
                      onChange={(event) => setDecisionReason(event.target.value)}
                      placeholder="Describe el motivo del rechazo"
                    />
                  </div>

                  <div className={styles.actions}>
                    <button type="button" className={styles.approveButton} onClick={handleApprove}>
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className={styles.rejectButton}
                      onClick={handleReject}
                      disabled={!decisionReason.trim()}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default SellerAdminPage
