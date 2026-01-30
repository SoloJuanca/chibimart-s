import '../env.js'

const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } = process.env

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export const sendVerificationEmail = async ({ email, firstName, code }) => {
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    throw new Error('Missing Brevo environment variables')
  }

  const payload = {
    sender: {
      name: BREVO_SENDER_NAME || 'Chibimart',
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email, name: firstName }],
    subject: 'Verifica tu cuenta en Chibimart',
    htmlContent: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Hola ${firstName || ''}</h2>
        <p>Tu código de verificación es:</p>
        <h3 style="letter-spacing: 4px;">${code}</h3>
        <p>Este código expira en 7 días.</p>
      </div>
    `,
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Brevo error: ${text}`)
  }
}
