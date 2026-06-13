import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { examSchema, gradeSchema } from '@/lib/validations'
import { z } from 'zod'
import { calculatePerformanceLevel } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'grades'
  const mine = searchParams.get('mine') === 'true'
  const page = parseInt(searchParams.get('page') ?? '1')
  const perPage = parseInt(searchParams.get('perPage') ?? '15')

  if (type === 'exams') {
    let where = {}
    if (mine && session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
      if (teacher) where = { class: { OR: [{ classTeacherId: teacher.id }, { subjects: { some: { teacherId: teacher.id } } }] } }
    }
    const exams = await prisma.exam.findMany({
      where,
      include: { class: { select: { id: true, name: true } }, term: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: exams.map((e) => ({ ...e, date: e.date?.toISOString() ?? null })) })
  }

  let where: Record<string, unknown> = {}
  if (mine && session.user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } })
    if (student) where.studentId = student.id
  }
  if (mine && session.user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (teacher) where.subject = { teacherId: teacher.id }
  }

  const [total, grades] = await Promise.all([
    prisma.grade.count({ where }),
    prisma.grade.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, studentId: true } },
        exam: { select: { id: true, name: true, totalMarks: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return NextResponse.json({ data: grades, total, page, perPage })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'TEACHER'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (type === 'exam') {
    try {
      const data = examSchema.parse(await req.json())
      const exam = await prisma.exam.create({
        data: { name: data.name, classId: data.classId, termId: data.termId, examType: data.examType, date: data.date ? new Date(data.date) : null, totalMarks: data.totalMarks, passingMarks: data.passingMarks },
      })
      return NextResponse.json({ data: exam }, { status: 201 })
    } catch (e) {
      if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
      return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
  }

  try {
    const body = await req.json()
    const data = gradeSchema.parse(body)
    const exam = await prisma.exam.findUnique({ where: { id: data.examId } })
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 400 })

    const grade = calculatePerformanceLevel(data.marks, exam.totalMarks)
    const record = await prisma.grade.upsert({
      where: { studentId_examId_subjectId: { studentId: data.studentId, examId: data.examId, subjectId: data.subjectId } },
      update: { marks: data.marks, grade, remarks: data.remarks },
      create: { studentId: data.studentId, examId: data.examId, subjectId: data.subjectId, marks: data.marks, grade, remarks: data.remarks },
    })
    return NextResponse.json({ data: record }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to record grade' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'TEACHER'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  if (type === 'exam') {
    const data = examSchema.partial().parse(await req.json())
    const exam = await prisma.exam.update({ where: { id }, data: { name: data.name, examType: data.examType, date: data.date ? new Date(data.date) : null, totalMarks: data.totalMarks, passingMarks: data.passingMarks } })
    return NextResponse.json({ data: exam })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  if (type === 'exam') { await prisma.exam.delete({ where: { id } }); return NextResponse.json({ message: 'Exam deleted' }) }
  if (type === 'grade') { await prisma.grade.delete({ where: { id } }); return NextResponse.json({ message: 'Grade deleted' }) }
  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
