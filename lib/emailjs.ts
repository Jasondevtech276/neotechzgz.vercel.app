type EmailParams = Record<string, string | number | undefined>

const endpoint = 'https://api.emailjs.com/api/v1.0/email/send'

export async function sendEmail(templateParams: EmailParams) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS configuration is missing')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service_id: serviceId, template_id: templateId, user_id: publicKey, template_params: templateParams }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`EmailJS request failed with status ${response.status}`)
  }
}
