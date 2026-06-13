import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const s = await prisma.examSchedule.update({
    where: { id: params.id },
    data: { title: body.title, date: new Date(body.date), startTime: body.startTime, endTime: body.endTime, venue: body.venue },
  })
  return NextResponse.json({ data: s })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.examSchedule.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
