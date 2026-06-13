import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, message } = await req.json()
  if (!to || !message) return NextResponse.json({ error: 'to and message required' }, { status: 400 })

  const apiKey = process.env.AT_API_KEY
  const username = process.env.AT_USERNAME ?? 'sandbox'

  if (!apiKey) return NextResponse.json({ error: 'Africa\'s Talking API key not configured. Add AT_API_KEY to .env' }, { status: 500 })

  const recipients = Array.isArray(to) ? to.join(',') : to
  const body = new URLSearchParams({ username, to: recipients, message })

  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: { apiKey, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const json = await res.json()
  if (!res.ok) return NextResponse.json({ error: json }, { status: 500 })
  return NextResponse.json({ data: json })
}
