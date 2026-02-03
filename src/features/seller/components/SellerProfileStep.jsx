import styles from '../pages/SellerApplyPage.module.css'

function SellerProfileStep({
  application,
  auth,
  profileErrors,
  formError,
  avatarStatus,
  avatarInputRef,
  nationalityOptions,
  phoneOptions,
  onProfileChange,
  onAvatarUpload,
  onAvatarDrop,
  onRemoveAvatar,
  onSubmit,
}) {
  return (
    <form className={styles.card} onSubmit={onSubmit}>
      <h2>Datos personales</h2>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="firstNames">Nombre(s)*</label>
          <input
            id="firstNames"
            name="firstNames"
            type="text"
            value={application.profileData.firstNames}
            onChange={onProfileChange}
            className={profileErrors.firstNames ? styles.inputError : ''}
            required
          />
          {profileErrors.firstNames && (
            <span className={styles.error}>{profileErrors.firstNames}</span>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="lastNames">Apellidos*</label>
          <input
            id="lastNames"
            name="lastNames"
            type="text"
            value={application.profileData.lastNames}
            onChange={onProfileChange}
            className={profileErrors.lastNames ? styles.inputError : ''}
            required
          />
          {profileErrors.lastNames && (
            <span className={styles.error}>{profileErrors.lastNames}</span>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="email">Correo*</label>
          <input
            id="email"
            name="email"
            type="email"
            value={application.profileData.email}
            onChange={onProfileChange}
            readOnly={Boolean(auth?.email)}
            className={profileErrors.email ? styles.inputError : ''}
            required
          />
          {profileErrors.email && <span className={styles.error}>{profileErrors.email}</span>}
        </div>
        <div className={styles.field}>
          <label htmlFor="nationality">Nacionalidad*</label>
          <select
            id="nationality"
            name="nationality"
            value={application.profileData.nationality}
            onChange={onProfileChange}
            className={profileErrors.nationality ? styles.inputError : ''}
            required
          >
            {nationalityOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="phoneCountryCode">Lada*</label>
          <select
            id="phoneCountryCode"
            name="phoneCountryCode"
            value={application.profileData.phoneCountryCode}
            onChange={onProfileChange}
            className={profileErrors.phoneCountryCode ? styles.inputError : ''}
            required
          >
            {phoneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {profileErrors.phoneCountryCode && (
            <span className={styles.error}>{profileErrors.phoneCountryCode}</span>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="phoneNumber">Teléfono de contacto*</label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={application.profileData.phoneNumber}
            onChange={onProfileChange}
            className={profileErrors.phoneNumber ? styles.inputError : ''}
            required
          />
          {profileErrors.phoneNumber && (
            <span className={styles.error}>{profileErrors.phoneNumber}</span>
          )}
        </div>
      </div>

      <div className={styles.sectionDivider} />

      <h2>Información pública</h2>
      <div className={styles.field}>
        <label htmlFor="username">Nombre de usuario*</label>
        <input
          id="username"
          name="username"
          type="text"
          value={application.profileData.username}
          onChange={onProfileChange}
          className={profileErrors.username ? styles.inputError : ''}
          required
        />
        {profileErrors.username && (
          <span className={styles.error}>{profileErrors.username}</span>
        )}
      </div>
      <div className={styles.field}>
        <label htmlFor="bio">Descripción de tu perfil</label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={application.profileData.bio}
          onChange={onProfileChange}
        />
      </div>

      <div className={styles.field}>
        <label>Imagen de perfil</label>
        {application.profileData.avatarUrl ? (
          <div className={styles.avatarPreview}>
            <img src={application.profileData.avatarUrl} alt="Vista previa" />
            <div className={styles.avatarActions}>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarStatus.loading}
              >
                Editar imagen
              </button>
              <button
                type="button"
                className={styles.linkButton}
                onClick={onRemoveAvatar}
                disabled={avatarStatus.loading}
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={styles.uploadBox}
            onClick={() => avatarInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onAvatarDrop}
            disabled={avatarStatus.loading}
          >
            <span className={styles.uploadIcon}>↓</span>
            Arrastra o <span className={styles.uploadLink}>sube aquí</span> tu imagen
            <span className={styles.uploadHint}>Tipo de archivos compatibles: .jpg, .gif, .png</span>
          </button>
        )}
        <input
          ref={avatarInputRef}
          className={styles.hiddenInput}
          type="file"
          accept=".jpg,.jpeg,.png,.gif"
          onChange={onAvatarUpload}
        />
        {avatarStatus.loading && <span className={styles.helperText}>Subiendo imagen...</span>}
        {avatarStatus.error && <span className={styles.error}>{avatarStatus.error}</span>}
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

export default SellerProfileStep
