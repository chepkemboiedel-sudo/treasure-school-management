import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meetings = await prisma.pTMeeting.findMany({
    include: {
      teacher: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true } },
      student: { select: { id: true, name: true, studentId: true } },
    },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json({ data: meetings })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const meeting = await prisma.pTMeeting.create({
    data: {
      teacherId: body.teacherId,
      parentId: body.parentId,
      studentId: body.studentId || null,
      date: new Date(body.date),
      duration: body.duration ?? 30,
      notes: body.notes,
      status: 'PENDING',
    },
    include: {
      teacher: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true } },
      student: { select: { id: true, name: true, studentId: true } },
    },
  })
  return NextResponse.json({ data: meeting }, { status: 201 })
}
