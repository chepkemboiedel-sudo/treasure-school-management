import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = req.nextUrl.searchParams.get('studentId')
  const records = await prisma.disciplinaryRecord.findMany({
    where: studentId ? { studentId } : {},
    include: { student: { select: { id: true, name: true, studentId: true } } },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ data: records })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const record = await prisma.disciplinaryRecord.create({
    data: {
      studentId: body.studentId,
      type: body.type ?? 'WARNING',
      description: body.description,
      actionTaken: body.actionTaken,
      date: body.date ? new Date(body.date) : new Date(),
      reportedBy: body.reportedBy,
      resolved: body.resolved ?? false,
    },
    include: { student: { select: { id: true, name: true, studentId: true } } },
  })
  return NextResponse.json({ data: record }, { status: 201 })
}
