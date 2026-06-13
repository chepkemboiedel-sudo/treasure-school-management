import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date required'),
  classId: z.string().min(1, 'Class required'),
  subjectId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')
  const studentId = searchParams.get('studentId')

  let where: Record<string, unknown> = {}

  if (session.user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (teacher) where.teacherId = teacher.id
  } else if (session.user.role === 'PARENT' && studentId) {
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classId: true } })
    if (student?.classId) where.classId = student.classId
  } else if (classId) {
    where.classId = classId
  }

  const assignments = await prisma.assignment.findMany({
    where,
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  })

  return NextResponse.json({ data: assignments })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'TEACHER'].includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const data = schema.parse(body)
    let teacherId: string

    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
      if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
      teacherId = teacher.id
    } else {
      teacherId = body.teacherId
      if (!teacherId) return NextResponse.json({ error: 'teacherId required for admin' }, { status: 400 })
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        classId: data.classId,
        subjectId: data.subjectId || null,
        teacherId,
      },
    })
    return NextResponse.json({ data: assignment }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
