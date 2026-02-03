import styles from '../pages/SellerApplyPage.module.css'

function SellerShippingStep({
  application,
  shippingErrors,
  formError,
  contactPhoneCode,
  contactPhoneNumber,
  contactPhoneDisabled,
  nationalityOptions,
  phoneOptions,
  onShippingChange,
  onSubmit,
}) {
  return (
    <form className={styles.card} onSubmit={onSubmit}>
      <h2>Configuración envíos</h2>
      <div className={styles.field}>
        <label htmlFor="streetAndNumber">Calle y número</label>
        <input
          id="streetAndNumber"
          name="streetAndNumber"
          type="text"
          value={application.shippingData.streetAndNumber}
          onChange={onShippingChange}
          className={shippingErrors.streetAndNumber ? styles.inputError : ''}
          required
        />
        {shippingErrors.streetAndNumber && (
          <span className={styles.error}>{shippingErrors.streetAndNumber}</span>
        )}
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="country">País</label>
          <select
            id="country"
            name="country"
            value={application.shippingData.country}
            onChange={onShippingChange}
            className={shippingErrors.country ? styles.inputError : ''}
            required
          >
            {nationalityOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          {shippingErrors.country && <span className={styles.error}>{shippingErrors.country}</span>}
        </div>
        <div className={styles.inlineField}>
          <div className={styles.field}>
            <label htmlFor="zipCode">Código postal</label>
            <input
              id="zipCode"
              name="zipCode"
              type="text"
              value={application.shippingData.zipCode}
              onChange={onShippingChange}
              maxLength={5}
              className={shippingErrors.zipCode ? styles.inputError : ''}
              required
            />
            {shippingErrors.zipCode && <span className={styles.error}>{shippingErrors.zipCode}</span>}
          </div>
          <button type="button" className={styles.secondaryButton}>
            Validar código
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="stateRegion1">Estado/Provincia/Región</label>
        <input
          id="stateRegion1"
          name="stateRegion1"
          type="text"
          value={application.shippingData.stateRegion1}
          onChange={onShippingChange}
          className={shippingErrors.stateRegion1 ? styles.inputError : ''}
          required
        />
        {shippingErrors.stateRegion1 && (
          <span className={styles.error}>{shippingErrors.stateRegion1}</span>
        )}
      </div>
      <div className={styles.field}>
        <label htmlFor="city">Ciudad</label>
        <input
          id="city"
          name="city"
          type="text"
          value={application.shippingData.city}
          onChange={onShippingChange}
          className={shippingErrors.city ? styles.inputError : ''}
          required
        />
        {shippingErrors.city && <span className={styles.error}>{shippingErrors.city}</span>}
      </div>

      <div className={styles.sectionDivider} />

      <h2>Datos de contacto</h2>
      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          name="useProfileContact"
          checked={application.shippingData.useProfileContact}
          onChange={onShippingChange}
        />
        Usar mismos datos de perfil
      </label>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="contactPhoneCountryCode">Lada*</label>
          <select
            id="contactPhoneCountryCode"
            name="contactPhoneCountryCode"
            value={contactPhoneCode}
            onChange={onShippingChange}
            disabled={contactPhoneDisabled}
            className={shippingErrors.contactPhoneCountryCode ? styles.inputError : ''}
            required
          >
            {phoneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {shippingErrors.contactPhoneCountryCode && (
            <span className={styles.error}>{shippingErrors.contactPhoneCountryCode}</span>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="contactPhoneNumber">Teléfono de contacto*</label>
          <input
            id="contactPhoneNumber"
            name="contactPhoneNumber"
            type="tel"
            value={contactPhoneNumber}
            onChange={onShippingChange}
            disabled={contactPhoneDisabled}
            className={shippingErrors.contactPhoneNumber ? styles.inputError : ''}
            required
          />
          {shippingErrors.contactPhoneNumber && (
            <span className={styles.error}>{shippingErrors.contactPhoneNumber}</span>
          )}
        </div>
      </div>

      {formError && <div className={styles.formError}>{formError}</div>}
      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryButton}>
          Guardar cambios
        </button>
      </div>
    </form>
  )
}

export default SellerShippingStep
