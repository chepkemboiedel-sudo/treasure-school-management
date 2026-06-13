import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const record = await prisma.studentBus.upsert({
    where: { studentId: body.studentId },
    create: { studentId: body.studentId, busId: body.busId, stopName: body.stopName },
    update: { busId: body.busId, stopName: body.stopName },
  })
  return NextResponse.json({ data: record }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = req.nextUrl.searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })
  await prisma.studentBus.delete({ where: { studentId } })
  return NextResponse.json({ ok: true })
}
