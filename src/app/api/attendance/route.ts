import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const perPage = parseInt(searchParams.get('perPage') ?? '15')
  const search = searchParams.get('search') ?? ''
  const mine = searchParams.get('mine') === 'true'

  let where: Record<string, unknown> = {}

  if (mine && session.user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } })
    if (student) where.studentId = student.id
  }

  if (search) {
    where.student = { name: { contains: search, mode: 'insensitive' } }
  }

  const [total, records] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, studentId: true } },
        class: { select: { id: true, name: true } },
        markedBy: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return NextResponse.json({
    data: records.map((r) => ({ ...r, date: r.date.toISOString(), createdAt: r.createdAt.toISOString() })),
    total, page, perPage,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { classId, date, records } = body

  if (!classId || !date || !Array.isArray(records)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
  if (!teacher && session.user.role === 'TEACHER') {
    return NextResponse.json({ error: 'Teacher profile not found' }, { status: 400 })
  }

  const markedById = teacher?.id ?? (await prisma.teacher.findFirst())?.id
  if (!markedById) return NextResponse.json({ error: 'No teacher found to mark attendance' }, { status: 400 })

  const parsedDate = new Date(date)

  const upserts = records.map((r: { studentId: string; status: string; note?: string }) =>
    prisma.attendance.upsert({
      where: { studentId_classId_date: { studentId: r.studentId, classId, date: parsedDate } },
      update: { status: r.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED', note: r.note },
      create: { studentId: r.studentId, classId, date: parsedDate, status: r.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED', note: r.note, markedById },
    })
  )

  await Promise.all(upserts)
  return NextResponse.json({ message: 'Attendance saved' })
}
