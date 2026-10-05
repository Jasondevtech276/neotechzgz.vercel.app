import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/emailjs'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rate = await checkRateLimit(`contact:${ip}`)
  if (!rate.success) return NextResponse.json({ error: 'Demasiados mensajes. Inténtalo más tarde.' }, { status: 429 })
  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (name.length < 2 || name.length > 120 || !/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(email) || message.length < 5 || message.length > 5000) {
      return NextResponse.json({ error: 'Datos de contacto no válidos' }, { status: 400 })
    }
    await sendEmail({ to_email: 'larbimhed260796@gmail.com', to_name: 'NeoTech ZGZ', reply_to: email, sender_name: name, message, subject: 'Nuevo contacto NeoTech ZGZ' })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[v0] contact route failed', error)
    return NextResponse.json({ error: 'No se pudo enviar el mensaje' }, { status: 500 })
  }
}
