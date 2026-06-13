import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const buses = await prisma.bus.findMany({
    include: { studentBuses: { include: { student: { select: { id: true, name: true, studentId: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ data: buses })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const bus = await prisma.bus.create({
    data: { plateNumber: body.plateNumber, driverName: body.driverName, driverPhone: body.driverPhone, capacity: body.capacity ?? 30, route: body.route },
  })
  return NextResponse.json({ data: bus }, { status: 201 })
}
