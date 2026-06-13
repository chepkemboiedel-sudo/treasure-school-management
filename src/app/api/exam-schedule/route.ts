import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const classId = req.nextUrl.searchParams.get('classId')
  const schedules = await prisma.examSchedule.findMany({
    where: classId ? { classId } : {},
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true } },
      term: { select: { id: true, name: true } },
    },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json({ data: schedules })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const schedule = await prisma.examSchedule.create({
    data: {
      title: body.title,
      classId: body.classId,
      subjectId: body.subjectId || null,
      termId: body.termId || null,
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime,
      venue: body.venue,
    },
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true } },
      term: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json({ data: schedule }, { status: 201 })
}
