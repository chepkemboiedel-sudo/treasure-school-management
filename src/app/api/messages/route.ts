import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const box = req.nextUrl.searchParams.get('box') ?? 'inbox'
  const messages = await prisma.message.findMany({
    where: box === 'sent'
      ? { fromUserId: session.user.id }
      : { toUserId: session.user.id },
    include: {
      from: { select: { id: true, email: true, role: true, admin: { select: { name: true } }, teacher: { select: { name: true } } } },
      to: { select: { id: true, email: true, role: true, admin: { select: { name: true } }, teacher: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ data: messages })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const msg = await prisma.message.create({
    data: { fromUserId: session.user.id, toUserId: body.toUserId, subject: body.subject, body: body.body },
  })
  return NextResponse.json({ data: msg }, { status: 201 })
}
