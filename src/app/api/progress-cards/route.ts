import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const examId = searchParams.get('examId')

  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: { select: { name: true, section: true, level: true } },
      grades: {
        where: examId ? { examId } : undefined,
        include: {
          subject: { select: { name: true, code: true } },
          exam: { select: { name: true, examType: true, totalMarks: true, term: { select: { name: true, academicYear: { select: { name: true } } } } } },
        },
        orderBy: { subject: { name: 'asc' } },
      },
    },
  })

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const exams = await prisma.exam.findMany({
    where: { classId: student.classId ?? '' },
    select: { id: true, name: true, examType: true, term: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const gradesByExam = student.grades.reduce((acc, g) => {
    const key = g.examId
    if (!acc[key]) acc[key] = { exam: g.exam, grades: [] }
    acc[key].grades.push(g)
    return acc
  }, {} as Record<string, { exam: typeof student.grades[0]['exam']; grades: typeof student.grades }>)

  return NextResponse.json({ data: { student, gradesByExam, exams } })
}
