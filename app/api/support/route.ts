import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/emailjs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  const { data, error } = await supabase.from('support_tickets').select('id,subject,message,status,created_at,updated_at').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'No se pudo cargar el soporte' }, { status: 500 })
  return NextResponse.json({ tickets: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (subject.length < 3 || subject.length > 160 || message.length < 10 || message.length > 5000) return NextResponse.json({ error: 'Completa el asunto y el mensaje correctamente' }, { status: 400 })
  const { data, error } = await supabase.from('support_tickets').insert({ user_id: user.id, subject, message }).select('id,subject,message,status,created_at').single()
  if (error) return NextResponse.json({ error: 'No se pudo crear el ticket' }, { status: 500 })
  if (user.email) try {
    await sendEmail({ to_email: user.email, to_name: user.user_metadata?.name ?? user.email, client_code: data.id, status: data.status, service: 'Soporte', message: `Hemos recibido tu consulta: ${data.subject}. Te responderemos lo antes posible.`, tracking_url: `${new URL(request.url).origin}/account` })
  } catch (emailError) {
    console.error('[v0] support confirmation email failed', emailError)
  }
  return NextResponse.json({ ticket: data, notification: 'queued' }, { status: 201 })
} 
