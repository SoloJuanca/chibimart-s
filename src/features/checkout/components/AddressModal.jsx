import styles from './AddressModal.module.css'

function AddressModal({ isOpen, values, onChange, onClose, onSubmit, countryOptions }) {
  if (!isOpen) return null

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Dirección de envío</h2>
          <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className={styles.field}>
          <label htmlFor="country">País</label>
          <select id="country" name="country" value={values.country} onChange={onChange}>
            {countryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="addressLine1">Dirección línea 1</label>
          <input
            id="addressLine1"
            name="addressLine1"
            type="text"
            placeholder="Calle y número"
            value={values.addressLine1}
            onChange={onChange}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="addressLine2">Dirección línea 2</label>
          <input
            id="addressLine2"
            name="addressLine2"
            type="text"
            placeholder="Colonia o sector"
            value={values.addressLine2}
            onChange={onChange}
          />
        </div>

        <div className={styles.inlineField}>
          <div className={styles.field}>
            <label htmlFor="zipCode">Código Postal</label>
            <input
              id="zipCode"
              name="zipCode"
              type="text"
              placeholder="00000"
              value={values.zipCode}
              onChange={onChange}
            />
          </div>
          <button className={styles.secondaryButton} type="button">
            Validar código
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.field}>
          <label htmlFor="phone">Número de teléfono</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="000-000000"
            value={values.phone}
            onChange={onChange}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="receiver">Persona que recibe (nombre y apellido)</label>
          <input
            id="receiver"
            name="receiver"
            type="text"
            placeholder="Escribe aquí..."
            value={values.receiver}
            onChange={onChange}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="instructions">Agregar instrucciones de entrega</label>
          <textarea
            id="instructions"
            name="instructions"
            rows="2"
            value={values.instructions}
            onChange={onChange}
          />
        </div>

        <button className={styles.primaryButton} type="button" onClick={onSubmit}>
          Usar esta dirección
        </button>
      </div>
    </div>
  )
}

export default AddressModal
