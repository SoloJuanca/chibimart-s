import '../env.js'

const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } = process.env

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

const sendBrevoEmail = async ({ to, subject, htmlContent }) => {
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    throw new Error('Missing Brevo environment variables')
  }

  const payload = {
    sender: {
      name: BREVO_SENDER_NAME || 'Chibimart',
      email: BREVO_SENDER_EMAIL,
    },
    to,
    subject,
    htmlContent,
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

export const sendVerificationEmail = async ({ email, firstName, code }) => {
  await sendBrevoEmail({
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
  })
}

export const sendListingQuestionEmail = async ({ email, listingTitle, question }) => {
  await sendBrevoEmail({
    to: [{ email }],
    subject: `Nueva pregunta en ${listingTitle}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Tienes una nueva pregunta</h2>
        <p>Producto: <strong>${listingTitle}</strong></p>
        <p>Pregunta:</p>
        <blockquote style="margin: 12px 0; padding: 12px; background: #f6f6f6; border-radius: 8px;">
          ${question}
        </blockquote>
        <p>Responde desde tu panel para notificar al comprador.</p>
      </div>
    `,
  })
}

export const sendListingAnswerEmail = async ({ email, listingTitle, question, answer }) => {
  await sendBrevoEmail({
    to: [{ email }],
    subject: `Respuesta a tu pregunta en ${listingTitle}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Tu pregunta fue respondida</h2>
        <p>Producto: <strong>${listingTitle}</strong></p>
        <p>Pregunta:</p>
        <blockquote style="margin: 12px 0; padding: 12px; background: #f6f6f6; border-radius: 8px;">
          ${question}
        </blockquote>
        <p>Respuesta:</p>
        <blockquote style="margin: 12px 0; padding: 12px; background: #fff3e6; border-radius: 8px;">
          ${answer}
        </blockquote>
      </div>
    `,
  })
}
