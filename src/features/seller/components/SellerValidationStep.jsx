import { Link } from 'react-router-dom'
import styles from '../pages/SellerApplyPage.module.css'

function SellerValidationStep({
  application,
  documentMode,
  onDocumentModeChange,
  isSubmitted,
  isApproved,
  isRejected,
  formatDate,
  documentInputRef,
  onDocumentDrop,
  onDocumentUpload,
  onRemoveDocument,
  validationError,
  canSubmitValidation,
  onSubmitValidation,
  onEditSubmission,
}) {
  return (
    <div className={styles.card}>
      {isSubmitted || isApproved || isRejected ? (
        <>
          <p className={styles.stepLabel}>Paso 2 de 2</p>
          <h2>{isApproved ? 'Aprobado' : 'En espera de validación'}</h2>
          {application.submittedAt && (
            <p className={styles.helperText}>
              Enviado a validación: {formatDate(application.submittedAt)}
            </p>
          )}
          {isRejected && (
            <p className={styles.error}>
              Motivo de rechazo: {application.decisionReason || 'Sin motivo registrado'}
            </p>
          )}

          <div className={styles.sectionDivider} />

          <h3>Identificación oficial</h3>
          <div className={styles.documentList}>
            {application.documents.map((doc) => (
              <div key={doc.type} className={styles.documentRow}>
                <img src={doc.fileUrl} alt="INE" className={styles.documentThumb} />
                <div>
                  <strong>{doc.fileName}</strong>
                  <span>Subido el {formatDate(doc.uploadedAt)}</span>
                </div>
                <a className={styles.linkButton} href={doc.fileUrl} download={doc.fileName}>
                  Descargar
                </a>
              </div>
            ))}
          </div>

          <div className={styles.formActions}>
            {(isSubmitted || isRejected) && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onEditSubmission}
              >
                Editar envío
              </button>
            )}
            {isApproved && (
              <Link className={styles.primaryButton} to="/seller/listings">
                Publicar productos
              </Link>
            )}
          </div>
        </>
      ) : (
        <>
          <p className={styles.stepLabel}>Paso 1 de 2</p>
          <h2>Envío a validación</h2>
          <p className={styles.helperText}>
            Tómale una foto a tu pasaporte o identificación, asegúrate que se vean tus datos
            personales y subir tanto el frente como la cara posterior de la identificación.
          </p>

          <div className={styles.field}>
            <label htmlFor="documentMode">Tipo de documento</label>
            <select id="documentMode" value={documentMode} onChange={onDocumentModeChange}>
              <option value="PASSPORT">Pasaporte (1 documento)</option>
              <option value="INE_PDF">INE PDF (1 documento)</option>
              <option value="INE_PHOTOS">INE fotos (2 documentos)</option>
            </select>
          </div>

          <button
            type="button"
            className={styles.uploadBox}
            onClick={() => documentInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDocumentDrop}
          >
            <span className={styles.uploadIcon}>↓</span>
            Arrastra o <span className={styles.uploadLink}>sube aquí</span> tu imagen
          </button>
          <span className={styles.uploadHint}>Tipo de archivos compatibles: .jpg, .gif, .png</span>
          <input
            ref={documentInputRef}
            className={styles.hiddenInput}
            type="file"
            accept=".jpg,.jpeg,.png,.gif"
            onChange={onDocumentUpload}
          />

          <div className={styles.documentSection}>
            <h3>Documentos cargados ({application.documents.length})</h3>
            <div className={styles.documentList}>
              {application.documents.map((doc) => (
                <div key={doc.type} className={styles.documentRow}>
                  <img src={doc.fileUrl} alt="INE" className={styles.documentThumb} />
                  <div>
                    <strong>{doc.fileName}</strong>
                    <span>Subido el {formatDate(doc.uploadedAt)}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.iconClose}
                    onClick={() => onRemoveDocument(doc.type)}
                    aria-label="Eliminar documento"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {validationError && <p className={styles.error}>{validationError}</p>}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={!canSubmitValidation}
              onClick={onSubmitValidation}
            >
              Enviar a validación
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default SellerValidationStep
