import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { timetableSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')
  const mine = searchParams.get('mine') === 'true'

  let where: Record<string, unknown> = {}
  if (classId) where.classId = classId

  if (mine) {
    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
      if (teacher) where.teacherId = teacher.id
    }
    if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: session.user.id } })
      if (student?.classId) where.classId = student.classId
    }
  }

  const slots = await prisma.timetable.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  return NextResponse.json({ data: slots })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const data = timetableSchema.parse(await req.json())
    const slot = await prisma.timetable.create({
      data: { classId: data.classId, subjectId: data.subjectId, teacherId: data.teacherId, dayOfWeek: data.dayOfWeek, startTime: data.startTime, endTime: data.endTime, room: data.room },
    })
    return NextResponse.json({ data: slot }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create timetable slot. Check for time conflicts.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await prisma.timetable.delete({ where: { id } })
  return NextResponse.json({ message: 'Slot deleted' })
}
