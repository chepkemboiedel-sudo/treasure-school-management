import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'PARENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Confirm this student is linked to the logged-in parent
  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: { students: { select: { id: true } } },
  })
  if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
  if (!parent.students.some((s) => s.id === params.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      class: {
        select: {
          id: true, name: true, section: true, level: true,
          classTeacher: { select: { name: true, phone: true } },
        },
      },
      grades: {
        include: {
          subject: { select: { name: true, code: true } },
          exam: {
            select: {
              id: true, name: true, examType: true, totalMarks: true,
              term: { select: { name: true, academicYear: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      attendance: {
        orderBy: { date: 'desc' },
        take: 90,
        include: { class: { select: { name: true, section: true } } },
      },
      feePayments: {
        include: { feeStructure: { select: { name: true, feeType: true, amount: true } } },
        orderBy: { paymentDate: 'desc' },
      },
    },
  })

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Group grades by exam
  const gradesByExam = student.grades.reduce((acc, g) => {
    const key = g.exam.id
    if (!acc[key]) acc[key] = { exam: g.exam, grades: [] }
    acc[key].grades.push(g)
    return acc
  }, {} as Record<string, { exam: typeof student.grades[0]['exam']; grades: typeof student.grades }>)

  // Attendance summary
  const total = student.attendance.length
  const present = student.attendance.filter((a) => a.status === 'PRESENT').length
  const absent = student.attendance.filter((a) => a.status === 'ABSENT').length
  const late = student.attendance.filter((a) => a.status === 'LATE').length
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0

  return NextResponse.json({
    data: {
      student: {
        id: student.id,
        name: student.name,
        studentId: student.studentId,
        dob: student.dob?.toISOString() ?? null,
        photo: student.photo,
        bloodGroup: student.bloodGroup,
        address: student.address,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        class: student.class,
      },
      gradesByExam,
      attendance: student.attendance.map((a) => ({
        ...a,
        date: a.date.toISOString(),
      })),
      attendanceSummary: { total, present, absent, late, attendanceRate },
      feePayments: student.feePayments,
    },
  })
}
