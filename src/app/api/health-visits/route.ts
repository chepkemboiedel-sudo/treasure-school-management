import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = req.nextUrl.searchParams.get('studentId')
  const date = req.nextUrl.searchParams.get('date')
  const visits = await prisma.healthVisit.findMany({
    where: {
      ...(studentId ? { studentId } : {}),
      ...(date ? { visitDate: { gte: new Date(date + 'T00:00:00'), lte: new Date(date + 'T23:59:59') } } : {}),
    },
    include: { student: { select: { id: true, name: true, studentId: true } } },
    orderBy: { visitDate: 'desc' },
  })
  return NextResponse.json({ data: visits })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'TEACHER'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const visit = await prisma.healthVisit.create({
    data: {
      studentId: body.studentId,
      visitDate: body.visitDate ? new Date(body.visitDate) : new Date(),
      complaint: body.complaint,
      diagnosis: body.diagnosis,
      treatment: body.treatment,
      referral: body.referral ?? false,
      attendedBy: body.attendedBy,
    },
    include: { student: { select: { id: true, name: true, studentId: true } } },
  })
  return NextResponse.json({ data: visit }, { status: 201 })
}
